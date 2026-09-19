"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import {
  EventType,
  Layout,
  Fit,
  Alignment,
  type Rive as RiveInstance,
  type Event as RiveEvent,
} from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `orbi.riv` — artboard `Artboard 1` (same file/artboard RobuMascot's intro
// plays on — see ROBU_RIVE_SRC). The `Robu-StateMachine` state machine has
// no inputs, so we drive the timelines directly: the slow `idle ` loop
// (note the trailing space — that's the clip's actual name, confirmed
// against the `.riv`'s own string table) is the ambient base (it also keeps
// Rive's render loop alive), and `eye blink 2` is replayed on top on its own
// interval. Unlike the old rig, this artboard has no ear-wiggle clip, so
// there's no periodic overlay for that beat — Robu just stays on the
// ambient loop.
const ROBU_ARTBOARD = "Artboard 1";
const ROBU_BASE_ANIMATIONS = ["idle "];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const EYEBLINK_ANIMATION = "eye blink 2";
const EYEBLINK_INTERVAL_MS = 5000;

// The old rig's artboard had a mouth-talking trio (one-shot open, looping
// chatter, one-shot close) and full happy/sad eyes+mouth trios (see
// MOOD_TIMELINES below) — `orbi.riv` has neither. `useTalkingMouth` and
// `useMoodOverlay` both guard on `rive.animationNames` before doing
// anything (same pattern `useGreetingOverlay` already used for a timeline
// that only existed in one of the old rig's two theme files), so against
// this file they simply no-op and Robu stays on the ambient loop for those
// moments instead of erroring or holding a half-played pose.
const MOUTH_TALK_START = "mouth talking start";
const MOUTH_TALK_LOOP = "mouth talking idle";
const MOUTH_TALK_END = "mouth talking end";
// Safety net for the start->loop handoff below, mirroring the watchdog
// pattern already used for the ambient base loop.
const MOUTH_TALK_WATCHDOG_MS = 500;

// How often the watchdog below checks that the base loop is still playing.
const AMBIENT_WATCHDOG_MS = 500;

export type Mood = "happy" | "sad";

// The old rig's eyes/mouth happy+sad trios the mouth-talking comment above
// points at. Kept as-is (rather than remapped to orbi.riv's partial "Eye
// happy start" / "Mouth_happy" / "Mouth_happy_to_normal" clips, which don't
// cover a full trio for either mood, let alone a "sad" one at all) — none of
// these names exist on orbi.riv's artboard, so `useMoodOverlay`'s own guard
// below leaves Robu on the ambient loop for both moods until a real trio
// exists to swap in.
const MOOD_TIMELINES: Record<
  Mood,
  { eyesStart: string; eyesLoop: string; eyesEnd: string; mouthStart: string; mouthLoop?: string; mouthEnd: string }
> = {
  happy: {
    eyesStart: "Eyes happy start",
    eyesLoop: "eyes happy loop",
    eyesEnd: "Eyes happy end",
    mouthStart: "mouth happy start",
    mouthLoop: "mouth happy idle",
    mouthEnd: "mouth happy end",
  },
  sad: {
    eyesStart: "Eyes sad start",
    eyesLoop: "eyes sad  loop", // two spaces — that's the timeline's actual name.
    eyesEnd: "Eyes sad end",
    mouthStart: "mouth sad start",
    mouthEnd: "mouth sad end",
  },
};
// Safety net for each mood's start->loop handoff, same shape as the mouth-talking watchdog.
const MOOD_WATCHDOG_MS = 500;

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
 * everything on the canvas, the ambient loop itself included.
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
 * Robu's one-shot greeting wave — screen 1 plays this right after the intro
 * finishes (see `trigger`). The old rig's two theme `.riv` files named this
 * differently (one had a complete "hii" timeline, the other only a "hii
 * start"/"hii end" bookend pair) — reading `rive.animationNames` at trigger
 * time picks whichever shape the loaded file actually has instead of
 * hardcoding one name that would silently no-op on the other. `orbi.riv` has
 * neither, so this naturally no-ops there too and Robu just stays on the
 * ambient loop instead of waving.
 */
export function useGreetingOverlay(rive: RiveInstance | null, trigger: boolean) {
  useEffect(() => {
    if (!rive || !trigger) return;

    const names = rive.animationNames;
    if (names.includes("hii")) {
      rive.stop("hii");
      rive.play("hii");
      return;
    }

    if (!names.includes("hii start")) return;
    rive.stop("hii end");
    rive.play("hii start");

    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const stoppedNames = Array.isArray(stopped)
        ? stopped
        : typeof stopped === "string"
          ? [stopped]
          : [];
      if (stoppedNames.includes("hii start") && names.includes("hii end")) {
        rive.play("hii end");
      }
    };
    rive.on(EventType.Stop, handleStop);
    return () => rive.off(EventType.Stop, handleStop);
  }, [rive, trigger]);
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
 *
 * Guarded on `rive.animationNames` the same way `useGreetingOverlay` already
 * guards a timeline that doesn't exist on every `.riv` — `orbi.riv` has no
 * mouth-talking trio at all, so this simply no-ops there and Robu stays on
 * the ambient loop for the whole span of `talking`.
 */
export function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  useEffect(() => {
    if (!rive || !rive.animationNames.includes(MOUTH_TALK_START)) return;

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

    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const names = Array.isArray(stopped)
        ? stopped
        : typeof stopped === "string"
          ? [stopped]
          : [];
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

/**
 * Plays the artboard's happy or sad eyes+mouth trio on top of the ambient
 * base loop, same shape as `useTalkingMouth`: the mood's "start" timelines
 * play once, then hand off to the (eyes-only, for "sad") looping idle once
 * they finish. Switching moods while still mounted (e.g. a fast re-check)
 * stops whatever the other mood left running, right at the top of the
 * effect, before starting the new one — so the two trios never layer on
 * each other.
 *
 * Deliberately does NOT call `rive.stop`/`play` in this effect's own
 * cleanup (unlike the mood-switch handling above) — cleanup also runs on
 * unmount, and by then Rive's own teardown may have already deleted the
 * underlying WASM artboard, throwing "Cannot pass deleted object as a
 * pointer of type Artboard". `RobuReaction`'s only caller unmounts it
 * outright once the mood is no longer relevant (the feedback panel goes
 * away), so there's nothing to settle back to neutral anyway. Same
 * listeners/timers-only cleanup shape `useTalkingMouth`/`useGreetingOverlay`
 * already use above.
 *
 * Guarded on `rive.animationNames` same as `useTalkingMouth` — `orbi.riv`
 * has neither mood's trio, so this no-ops there and Robu stays on the
 * ambient loop regardless of `mood`.
 */
export function useMoodOverlay(rive: RiveInstance | null, mood: Mood | null) {
  useEffect(() => {
    if (!rive || !mood) return;

    const cfg = MOOD_TIMELINES[mood];
    if (!rive.animationNames.includes(cfg.eyesStart)) return;
    const other = MOOD_TIMELINES[mood === "happy" ? "sad" : "happy"];
    rive.stop(other.eyesStart);
    rive.stop(other.eyesLoop);
    rive.stop(other.eyesEnd);
    rive.stop(other.mouthStart);
    if (other.mouthLoop) rive.stop(other.mouthLoop);
    rive.stop(other.mouthEnd);

    rive.stop(cfg.eyesEnd);
    rive.stop(cfg.mouthEnd);
    rive.play(cfg.eyesStart);
    rive.play(cfg.mouthStart);

    let loopStarted = false;
    const startLoop = () => {
      if (loopStarted) return;
      loopStarted = true;
      rive.play(cfg.eyesLoop);
      if (cfg.mouthLoop) rive.play(cfg.mouthLoop);
    };

    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const names = Array.isArray(stopped)
        ? stopped
        : typeof stopped === "string"
          ? [stopped]
          : [];
      if (names.includes(cfg.eyesStart) || names.includes(cfg.mouthStart)) startLoop();
    };
    rive.on(EventType.Stop, handleStop);

    const fallback = window.setTimeout(startLoop, 600);
    const watchdog = window.setInterval(() => {
      if (!loopStarted) return;
      if (!rive.playingAnimationNames.includes(cfg.eyesLoop)) rive.play(cfg.eyesLoop);
      if (cfg.mouthLoop && !rive.playingAnimationNames.includes(cfg.mouthLoop)) {
        rive.play(cfg.mouthLoop);
      }
    }, MOOD_WATCHDOG_MS);

    return () => {
      rive.off(EventType.Stop, handleStop);
      window.clearTimeout(fallback);
      window.clearInterval(watchdog);
    };
  }, [rive, mood]);
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
    src: ROBU_RIVE_SRC,
    artboard: ROBU_ARTBOARD,
    animations: ROBU_BASE_ANIMATIONS,
    autoplay: true,
    autoBind: true,
    layout: ROBU_LAYOUT,
  });

  useAmbientLoop(rive, ROBU_BASE_ANIMATIONS);
  usePeriodicOverlay(rive, EYEBLINK_ANIMATION, EYEBLINK_INTERVAL_MS);

  return (
    <div className={className}>
      <RiveComponent className="absolute top-10 right-20 h-[100px] w-[100px]" />
    </div>
  );
}
