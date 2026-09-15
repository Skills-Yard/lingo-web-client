"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  EventType,
  Layout,
  Fit,
  Alignment,
  type Rive as RiveInstance,
} from "@rive-app/canvas";
import { configureRiveRuntime, getRobuRiveSrc } from "@/lib/rive/runtime";
import { useTheme } from "@/context/ThemeContext";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `updated_robu.riv` — artboard `Anim Skill` (same file/artboard RobuMascot's
// entrance plays on — see getRobuRiveSrc). The `robu anim` state machine has
// no inputs, so we drive the timelines directly: the slow `idle2` loop is
// the ambient base (it also keeps Rive's render loop alive), and `ears` /
// `eyeblink twice` are each replayed on top on their own interval.
const ROBU_ARTBOARD = "Anim Skill";
const ROBU_BASE_ANIMATIONS = ["idle2"];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const EAR_ANIMATION = "ears";
const EAR_INTERVAL_MS = 3000;

const EYEBLINK_ANIMATION = "eyeblink twice";
const EYEBLINK_INTERVAL_MS = 5000;

// Same artboard's mouth-talking trio — a one-shot open ("start"), a looping
// chatter cycle ("idle"), and a one-shot close ("end"). Same naming shape as
// the eyes' own happy/sad trios on this artboard, just driven by "is Robu
// currently talking" instead of a fixed interval.
const MOUTH_TALK_START = "mouth talking start";
const MOUTH_TALK_LOOP = "mouth talking idle";
const MOUTH_TALK_END = "mouth talking end";
// Safety net for the start->loop handoff below, mirroring the watchdog
// pattern already used for the ambient base loop.
const MOUTH_TALK_WATCHDOG_MS = 500;

// How often the watchdog below checks that the base loop is still playing.
const AMBIENT_WATCHDOG_MS = 500;

/**
 * Exported (rather than kept local to this file) so RobuMascot can drive the
 * exact same ambient behavior on its own Rive instance once its one-shot
 * entrance timeline finishes — see RobuMascot's doc comment for why it needs
 * its own copy of "the ambient loop" instead of just switching over to this
 * component.
 *
 * Keep the ambient base animations playing for the whole life of the
 * component. If a base timeline is authored as one-shot (not looping) in the
 * editor, it plays once, reaches its end, and its internal `playing` flag
 * flips off — merely calling `play()` again on that same, still-instanced
 * animation does NOT rewind it, it just holds on the final frame. `stop()`
 * first removes the finished instance entirely, so the following `play()`
 * creates a fresh one and explicitly resets it to frame 0 (same as the
 * one-shot overlays below). This also guards against Rive's render loop going
 * idle when nothing is actively playing, which would otherwise freeze
 * everything on the canvas, `idle2` included.
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

/**
 * Drives Robu's mouth-talking overlay on top of the ambient base loop, same
 * artboard as `useAmbientLoop`/`usePeriodicOverlay` above. `talking` flipping
 * true plays the one-shot "start" timeline, then — once that timeline
 * actually finishes, not immediately — hands off to the looping "idle"
 * chatter cycle; layering both from frame 0 instead would let the loop's own
 * frames immediately fight the opening transition. Flipping back to false
 * stops the loop and plays the one-shot "end" timeline to close the mouth
 * back up. Exported (like the two hooks above) so RobuMascot can drive the
 * exact same overlay on its own Rive instance.
 */
export function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  useEffect(() => {
    if (!rive) return;

    if (!talking) {
      rive.stop(MOUTH_TALK_LOOP);
      rive.stop(MOUTH_TALK_START);
      rive.play(MOUTH_TALK_END);
      return;
    }

    rive.stop(MOUTH_TALK_END);
    rive.play(MOUTH_TALK_START);

    let loopStarted = false;
    const startLoop = () => {
      if (loopStarted) return;
      loopStarted = true;
      rive.play(MOUTH_TALK_LOOP);
    };

    const handleStop = (event: { data?: string | string[] }) => {
      const stopped = event.data;
      const names = Array.isArray(stopped) ? stopped : stopped ? [stopped] : [];
      if (names.includes(MOUTH_TALK_START)) startLoop();
    };
    rive.on(EventType.Stop, handleStop);

    // In case the Stop event is ever missed (e.g. autoplay hiccups), don't
    // strand Robu mid-transition with a closed mouth for the rest of a long
    // line — same fallback shape as RobuMascot's own intro-timeline handoff.
    const fallback = window.setTimeout(startLoop, 600);

    const watchdog = window.setInterval(() => {
      if (loopStarted && !rive.playingAnimationNames.includes(MOUTH_TALK_LOOP)) {
        rive.play(MOUTH_TALK_LOOP);
      }
    }, MOUTH_TALK_WATCHDOG_MS);

    return () => {
      rive.off(EventType.Stop, handleStop);
      window.clearTimeout(fallback);
      window.clearInterval(watchdog);
    };
  }, [rive, talking]);
}

interface RobuEyeBlinkProps {
  /** Sizing / positioning classes for the canvas wrapper. */
  className?: string;
}

/**
 * Robu mascot. The `.riv` is vector-only, so it is cheap to drop onto any
 * screen. Give it a sized wrapper via `className` — the canvas fills it and
 * `Fit.Contain` keeps the whole mascot visible as it scales.
 *
 * `useRive`'s `src` option only loads once at mount, so swapping Robu's
 * `.riv` when the theme toggles needs a remount — `key={theme}` on the inner
 * component forces exactly that (see RobuMascot's identical trick).
 */
export function RobuEyeBlink({ className }: RobuEyeBlinkProps) {
  const { theme } = useTheme();
  return <RobuEyeBlinkCanvas key={theme} className={className} src={getRobuRiveSrc(theme)} />;
}

function RobuEyeBlinkCanvas({ className, src }: RobuEyeBlinkProps & { src: string }) {
  const { rive, RiveComponent } = useRive({
    src,
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
      <RiveComponent className="absolute top-10 right-20 h-[100px] w-[100px]" />
    </div>
  );
}
