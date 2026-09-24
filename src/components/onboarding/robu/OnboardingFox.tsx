"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  Layout,
  Fit,
  Alignment,
  EventType,
  type Event as RiveEvent,
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

// The greeting wave — the file's "hi " clip (trailing space is the file's own
// spelling, same as the blink clip above). The clip is authored to loop, so
// "once" means stopping it at the end of its first cycle (see
// useGreetingOnce) — and, unlike the ambient/blink loops, there's
// deliberately no watchdog or repeat timer to bring it back. The short delay
// lets the screen's own crossfade-in (see OnboardingFlow's SCREEN_TRANSITION)
// finish first, so the wave starts on a fully visible fox instead of playing
// out mid-fade.
const GREETING_ANIMATIONS = ["hi "];
const GREETING_DELAY_MS = 400;

// The mouth layer's talking clip, played on top of the ambient loop for as
// long as the screen's speech bubble is typing (see FoxMessageScreen).
// Unlike the clips above, this one has no trailing space in the file.
const SPEAK_ANIMATION = "speak";

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

function useGreetingOnce(rive: RiveInstance | null, enabled: boolean) {
  useEffect(() => {
    if (!rive || !enabled) return;
    const name = GREETING_ANIMATIONS.find((n) => rive.animationNames.includes(n));
    if (!name) return;

    // A looping clip reports each completed cycle as a Loop event — stopping
    // on the first one leaves exactly one full wave.
    const handleLoop = (event: RiveEvent) => {
      const data = event.data as { animation?: string } | undefined;
      if (data?.animation === name) rive.stop(name);
    };
    rive.on(EventType.Loop, handleLoop);

    const timer = window.setTimeout(() => {
      rive.stop(name);
      rive.play(name);
    }, GREETING_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      rive.off(EventType.Loop, handleLoop);
    };
  }, [rive, enabled]);
}

/**
 * Loops `speak` back-to-back for as long as `talking` is true (the clip is
 * authored one-shot, so it's restarted the instant it ends) and stops it the
 * moment `talking` flips false. Cleanup only clears the listener/timer —
 * calling `rive.stop()` there would also run on unmount, after Rive may
 * already have deleted the artboard.
 */
function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  useEffect(() => {
    if (!rive || !rive.animationNames.includes(SPEAK_ANIMATION)) return;
    if (!talking) {
      rive.stop(SPEAK_ANIMATION);
      return;
    }
    // `stop()` before `play()` rewinds the clip — replaying a finished
    // one-shot would otherwise just hold its last frame. `restarting` keeps
    // our own `stop()` (which fires a Stop event too) from re-entering.
    let restarting = false;
    const restart = () => {
      if (restarting) return;
      restarting = true;
      rive.stop(SPEAK_ANIMATION);
      rive.play(SPEAK_ANIMATION);
      restarting = false;
    };
    // Loops the clip seamlessly: restart it the instant it ends, for as long
    // as the text is still typing.
    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const names = Array.isArray(stopped) ? stopped : [stopped];
      if (names.includes(SPEAK_ANIMATION)) restart();
    };
    rive.on(EventType.Stop, handleStop);
    restart();
    // Backup only, in case a Stop event is ever missed.
    const timer = window.setInterval(() => {
      if (!rive.playingAnimationNames.includes(SPEAK_ANIMATION)) restart();
    }, AMBIENT_WATCHDOG_MS);
    return () => {
      window.clearInterval(timer);
      rive.off(EventType.Stop, handleStop);
    };
  }, [rive, talking]);
}

interface OnboardingFoxProps {
  className?: string;
  /** Waves hello once, shortly after mounting — only the "Hey! I am foxy"
   * greeting screen; every other screen's fox stays on the plain ambient
   * loop. */
  greet?: boolean;
  /** Moves the fox's mouth ("speak" clip) for as long as this is true — the
   * screen's speech bubble typing its line. */
  talking?: boolean;
}

/**
 * The onboarding flow's fox — plain ambient idle/blink/ear loop, no boot-up
 * sequence of its own (PreLoginScreen and every question screen just drop
 * this in already-idle, same role `<RobuEyeBlink>` plays for
 * instructions-intro's own reveal-card modal and game screens).
 */
export function OnboardingFox({ className, greet = false, talking = false }: OnboardingFoxProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: BASE_ANIMATIONS,
    autoplay: true,
    layout: LAYOUT,
  });

  useAmbientLoop(rive, BASE_ANIMATIONS);
  useGreetingOnce(rive, greet);
  useTalkingMouth(rive, talking);
  useRandomOverlay(rive, BLINK_ANIMATIONS, BLINK_MS, BLINK_MS, BLINK_HOLD_MS);
  useRandomOverlay(rive, EAR_ANIMATIONS, EAR_MIN_MS, EAR_MAX_MS);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
