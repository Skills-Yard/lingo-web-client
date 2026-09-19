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
// plays on — see ROBU_RIVE_SRC). This standalone badge has no boot-up intro
// of its own (unlike RobuMascot), so it drives the ambient `idle ` timeline
// directly rather than through `Robu-StateMachine` — going through the state
// machine here would replay its own boot sequence on every mount, which is
// exactly what this component (used for the reveal-card modal, the game
// screens' demo/level platforms) is not supposed to show.
const ROBU_ARTBOARD = "Artboard 1";
const ROBU_BASE_ANIMATIONS = ["idle "];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Both randomized rather than fixed-interval — see `useRandomOverlay` —
// so the blink and the idle glance below read as unscripted instead of
// metronomic. Ranges are this file's own judgment call (not specified),
// picked so blink stays roughly human-paced and the glance is rarer, so
// they don't constantly compete with each other or with `idle ` itself.
const EYEBLINK_ANIMATIONS = ["eye blink 2"];
const EYEBLINK_MIN_MS = 3000;
const EYEBLINK_MAX_MS = 6000;

// The two "look to the side" clips, replayed at random and picked at random
// each cycle — `eys left ` is the file's own spelling (confirmed against its
// string table), not a typo introduced here.
const GLANCE_ANIMATIONS = ["eyes left & right", "eys left "];
const GLANCE_MIN_MS = 5000;
const GLANCE_MAX_MS = 10000;

// The same expression clip the boot sequence itself opens with (see
// RobuMascot's STATE_MACHINE) — no separate start/loop/end talking trio
// like the old rig had, so `useTalkingMouth` below just keeps replaying
// this one clip for as long as `talking` is true and stops it the instant
// it isn't. The plain `mouth ` clip was tried first and rejected — playing
// it blanks the whole screen (no visible eyes/mouth) rather than showing a
// distinct expression, confirmed by watching it frozen through an entire
// typing span.
const MOUTH_ANIMATION = "Mouth_expression";
const MOUTH_WATCHDOG_MS = 500;

// How often the watchdog below checks that the base loop is still playing.
const AMBIENT_WATCHDOG_MS = 500;

export type Mood = "happy" | "sad";

// The old rig's eyes/mouth happy+sad trios. Kept as-is (rather than remapped
// to orbi.riv's partial "Eye happy start" / "Mouth_happy" /
// "Mouth_happy_to_normal" clips, which don't cover a full trio for either
// mood, let alone a "sad" one at all) — none of these names exist on
// orbi.riv's artboard, so `useMoodOverlay`'s own guard below leaves Robu on
// the ambient loop for both moods until a real trio exists to swap in.
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
 * exact same ambient behavior on its own Rive instance for the one case it
 * still plays a raw `idle ` timeline directly (skipping its own intro) —
 * see RobuMascot's doc comment.
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
 * Replay one of `animations` (picked at random each cycle — a single-name
 * array always replays that one) on top of whatever's already running,
 * waiting a random delay between `minMs` and `maxMs` before each replay.
 * Drives Robu's eyeblink and idle eye-glance flourishes — random timing
 * (rather than `usePeriodicOverlay`'s fixed interval) is what keeps them
 * reading as unscripted instead of metronomic.
 */
export function useRandomOverlay(
  rive: RiveInstance | null,
  animations: string[],
  minMs: number,
  maxMs: number,
) {
  useEffect(() => {
    if (!rive || animations.length === 0) return;

    let timer: number;
    const scheduleNext = () => {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = window.setTimeout(() => {
        const name = animations[Math.floor(Math.random() * animations.length)];
        rive.stop(name);
        rive.play(name);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => window.clearTimeout(timer);
  }, [rive, animations, minMs, maxMs]);
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
 * Drives Robu's mouth-movement overlay on top of the ambient base loop:
 * keeps `Mouth_expression` playing for as long as `talking` is true, and
 * stops it the instant it flips false. The watchdog mirrors
 * `useAmbientLoop`'s own — it's authored as one-shot rather than looping,
 * so this keeps re-triggering it (`stop()` then `play()`, to actually
 * rewind it — see useAmbientLoop's own doc comment for why) rather than
 * freezing on its last frame for the rest of a long line.
 */
export function useTalkingMouth(rive: RiveInstance | null, talking: boolean) {
  useEffect(() => {
    if (!rive) return;

    if (!talking) {
      rive.stop(MOUTH_ANIMATION);
      return;
    }

    const ensurePlaying = () => {
      if (!rive.playingAnimationNames.includes(MOUTH_ANIMATION)) {
        // Re-trigger from frame 0 — see useAmbientLoop's own doc comment for
        // why `stop()` has to come first: calling `play()` again on an
        // already-finished one-shot instance just holds its last frame
        // rather than rewinding it.
        rive.stop(MOUTH_ANIMATION);
        rive.play(MOUTH_ANIMATION);
      }
    };
    ensurePlaying();
    const watchdog = window.setInterval(ensurePlaying, MOUTH_WATCHDOG_MS);
    return () => {
      window.clearInterval(watchdog);
      rive.stop(MOUTH_ANIMATION);
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
 * Guarded on `rive.animationNames` same as `useTalkingMouth` used to be —
 * `orbi.riv` has neither mood's trio, so this no-ops there and Robu stays on
 * the ambient loop regardless of `mood`.
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
  useRandomOverlay(rive, EYEBLINK_ANIMATIONS, EYEBLINK_MIN_MS, EYEBLINK_MAX_MS);
  useRandomOverlay(rive, GLANCE_ANIMATIONS, GLANCE_MIN_MS, GLANCE_MAX_MS);

  return (
    <div className={className}>
      <RiveComponent className="absolute top-10 right-20 h-[100px] w-[100px]" />
    </div>
  );
}
