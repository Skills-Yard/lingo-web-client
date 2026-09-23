"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  Layout,
  Fit,
  Alignment,
  type Rive as RiveInstance,
} from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Same file/artboard every other Robu instance in the app uses (see
// ROBU_RIVE_SRC) — this is a fresh, minimal component rather than a reuse of
// instructions-intro's own `<RobuEyeBlink>`: that one hardcodes its inner
// canvas to `absolute top-10 right-20 h-[100px] w-[100px]`, sized for its one
// call site (a small corner badge over a reveal-card modal) — sizing this
// screen's fox instead needs a plain `h-full w-full` fill of whatever box the
// caller gives it, the same pattern RobuMascot/RobuSplash already use.
const ARTBOARD = "Artboard 2";
const BASE_ANIMATIONS = ["idle "];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Fixed 5s cadence rather than a random range — the blink clip loops in the
// editor (it doesn't settle back to open on its own), so without an explicit
// `holdMs` force-stop it would just keep blinking for the entire gap until
// the next trigger, reading as never stopping at all. Trailing space on the
// clip name is the file's own spelling (confirmed against its string table).
const BLINK_ANIMATIONS = ["both eye pupil blink "];
const BLINK_MS = 5000;
const BLINK_HOLD_MS = 600;

// Randomized (not fixed-interval) so it reads as unscripted instead of
// metronomic, centered on a ~10s cadence.
const EAR_ANIMATIONS = ["ear blink"];
const EAR_MIN_MS = 8000;
const EAR_MAX_MS = 12000;

const AMBIENT_WATCHDOG_MS = 500;

function useAmbientLoop(rive: RiveInstance | null, animations: string[]) {
  useEffect(() => {
    if (!rive) return;
    const ensurePlaying = () => {
      for (const name of animations) {
        if (!rive.playingAnimationNames.includes(name)) {
          rive.stop(name);
          rive.play(name);
        }
      }
    };
    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive, animations]);
}

function useRandomOverlay(
  rive: RiveInstance | null,
  animations: string[],
  minMs: number,
  maxMs: number,
  holdMs?: number,
) {
  useEffect(() => {
    if (!rive || animations.length === 0) return;
    let timer: number;
    let stopTimer: number | undefined;
    const scheduleNext = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = window.setTimeout(() => {
        const name = animations[Math.floor(Math.random() * animations.length)];
        rive.stop(name);
        rive.play(name);
        if (holdMs !== undefined) {
          stopTimer = window.setTimeout(() => rive.stop(name), holdMs);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      window.clearTimeout(timer);
      if (stopTimer !== undefined) window.clearTimeout(stopTimer);
    };
  }, [rive, animations, minMs, maxMs, holdMs]);
}

interface OnboardingFoxProps {
  className?: string;
}

/**
 * The onboarding flow's fox — plain ambient idle/blink/ear loop, no boot-up
 * sequence of its own (PreLoginScreen and every question screen just drop
 * this in already-idle, same role `<RobuEyeBlink>` plays for
 * instructions-intro's own reveal-card modal and game screens).
 */
export function OnboardingFox({ className }: OnboardingFoxProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: BASE_ANIMATIONS,
    autoplay: true,
    layout: LAYOUT,
  });

  useAmbientLoop(rive, BASE_ANIMATIONS);
  useRandomOverlay(rive, BLINK_ANIMATIONS, BLINK_MS, BLINK_MS, BLINK_HOLD_MS);
  useRandomOverlay(rive, EAR_ANIMATIONS, EAR_MIN_MS, EAR_MAX_MS);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
