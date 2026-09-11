"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive as RiveInstance } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ROBU_EYEBLINK_RIVE_SRC,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `robu_update_day2.riv` — artboard `Anim Skill`. The `robu anim` state
// machine has no inputs, so we drive the timelines directly: the slow `idle2`
// loop is the ambient base (it also keeps Rive's render loop alive), and
// `ears` / `eyeblink2` are each replayed on top on their own interval.
const ROBU_ARTBOARD = "Anim Skill";
const ROBU_BASE_ANIMATIONS = ["idle2"];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const EAR_ANIMATION = "ears";
const EAR_INTERVAL_MS = 3000;

const EYEBLINK_ANIMATION = "eyeblink2";
const EYEBLINK_INTERVAL_MS = 5000;

// How often the watchdog below checks that the base loop is still playing.
const AMBIENT_WATCHDOG_MS = 500;

/**
 * Keep the ambient base animations playing for the whole life of the
 * component. Rive's own render loop can go idle once nothing is actively
 * playing — and a `stop()` on an overlay animation (see `usePeriodicOverlay`
 * below) can be enough to trip that, freezing *everything* on the canvas,
 * `idle2` included. Re-adding any base animation that has dropped out of
 * `playingAnimationNames` keeps the render loop alive so overlay replays stay
 * visible too.
 */
function useAmbientLoop(rive: RiveInstance | null, animations: string[]) {
  useEffect(() => {
    if (!rive) return;

    const ensurePlaying = () => {
      for (const name of animations) {
        if (!rive.playingAnimationNames.includes(name)) {
          rive.play(name);
        }
      }
    };

    ensurePlaying();
    const timer = window.setInterval(ensurePlaying, AMBIENT_WATCHDOG_MS);
    return () => window.clearInterval(timer);
  }, [rive, animations]);
}

/**
 * Replay a one-shot timeline on top of the ambient base loop every
 * `intervalMs`. `stop` before `play` rewinds it so each replay starts from
 * frame 0 even if the previous one is still finishing.
 */
function usePeriodicOverlay(
  rive: RiveInstance | null,
  animation: string,
  intervalMs: number,
) {
  useEffect(() => {
    if (!rive) return;

    const replay = () => {
      rive.stop(animation);
      rive.play(animation);
    };

    const timer = window.setInterval(replay, intervalMs);
    return () => {
      window.clearInterval(timer);
      rive.stop(animation);
    };
  }, [rive, animation, intervalMs]);
}

interface RobuEyeBlinkProps {
  /** Sizing / positioning classes for the canvas wrapper. */
  className?: string;
}

/**
 * Robu mascot. The `.riv` is vector-only, so it is cheap to drop onto any
 * screen. Give it a sized wrapper via `className` — the canvas fills it and
 * `Fit.Contain` keeps the whole mascot visible as it scales.
 */
export function RobuEyeBlink({ className }: RobuEyeBlinkProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_EYEBLINK_RIVE_SRC,
    artboard: ROBU_ARTBOARD,
    animations: ROBU_BASE_ANIMATIONS,
    autoplay: true,
    autoBind: true,
    layout: ROBU_LAYOUT,
  });

  useAmbientLoop(rive, ROBU_BASE_ANIMATIONS);
  usePeriodicOverlay(rive, EAR_ANIMATION, EAR_INTERVAL_MS);
  usePeriodicOverlay(rive, EYEBLINK_ANIMATION, EYEBLINK_INTERVAL_MS);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
