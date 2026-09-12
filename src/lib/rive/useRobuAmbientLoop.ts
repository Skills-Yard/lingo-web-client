import { useEffect } from "react";
import type { Rive as RiveInstance } from "@rive-app/canvas";

// Shared between every Robu mascot rig built on the "Anim Skill" artboard
// (`RobuEyeBlink`, `RobuIntroMascot`, …) — same base timelines, same
// keep-alive quirks, so the driving logic lives in one place.

/** How often the watchdog below checks that the base loop is still playing. */
export const AMBIENT_WATCHDOG_MS = 500;

/**
 * Keep the ambient base animations playing for the whole life of the
 * component. If a base timeline is authored as one-shot (not looping) in the
 * editor, it plays once, reaches its end, and its internal `playing` flag
 * flips off — merely calling `play()` again on that same, still-instanced
 * animation does NOT rewind it, it just holds on the final frame. `stop()`
 * first removes the finished instance entirely, so the following `play()`
 * creates a fresh one and explicitly resets it to frame 0 (same as the
 * one-shot overlays below). This also guards against Rive's render loop going
 * idle when nothing is actively playing, which would otherwise freeze
 * everything on the canvas.
 */
export function useAmbientLoop(rive: RiveInstance | null, animations: string[]) {
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

/**
 * Replay a one-shot timeline on top of the ambient base loop every
 * `intervalMs`. `stop` before `play` rewinds it so each replay starts from
 * frame 0 even if the previous one is still finishing.
 */
export function usePeriodicOverlay(
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
