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

// `orbi.riv` — artboard `Artboard 2` (same file/artboard RobuMascot's intro
// plays on — see ROBU_RIVE_SRC). This standalone badge has no boot-up intro
// of its own (unlike RobuMascot), so it drives the ambient `idle ` timeline
// directly rather than playing the "hi " clip first — that clip is only for
// RobuMascot's own one-shot entrance, and playing it here would replay it on
// every mount, which is exactly what this component (used for the
// reveal-card modal, the game screens' demo/level platforms) is not supposed
// to show.
const ROBU_ARTBOARD = "Artboard 2";
const ROBU_BASE_ANIMATIONS = ["idle "];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Fixed 5s cadence rather than a random range — the blink clip loops in the
// editor (it doesn't settle back to open on its own), so without an explicit
// `holdMs` force-stop (see useRandomOverlay) it would just keep blinking for
// the entire gap until the next trigger, reading as never stopping at all.
// Trailing space on the blink clip is the file's own spelling (confirmed
// against its string table), not a typo introduced here.
const EYEBLINK_ANIMATIONS = ["both eye pupil blink "];
const EYEBLINK_MIN_MS = 5000;
const EYEBLINK_MAX_MS = 5000;
const EYEBLINK_HOLD_MS = 600;

// The ear flourish is randomized (not fixed-interval) so it reads as
// unscripted instead of metronomic, centered on the ~10s cadence asked for.
const EAR_ANIMATIONS = ["ear blink"];
const EAR_MIN_MS = 8000;
const EAR_MAX_MS = 12000;

// Robu's mouth-movement clip for the talking overlay — no separate
// start/loop/end talking trio like the old rig had, so `useTalkingMouth`
// below just keeps replaying this one clip for as long as `talking` is true
// and stops it the instant it isn't. The caller gates `talking` to screen 2
// onward (InstructionsIntroFlow only passes it true once past the cover
// screen), so this never fights the "hi " intro clip on screen 1. Trailing
// space is the file's own spelling.
const MOUTH_ANIMATION = "speak ";
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
 * array always replays that one, and `minMs === maxMs` gives a fixed
 * cadence instead of a random one) on top of whatever's already running,
 * waiting a delay between `minMs` and `maxMs` before each replay. Drives
 * Robu's eyeblink and idle eye-glance flourishes — random timing (rather
 * than `usePeriodicOverlay`'s fixed interval) is what keeps them reading as
 * unscripted instead of metronomic.
 *
 * `holdMs`, if given, force-stops the clip that many ms after triggering it
 * rather than leaving it running until the next scheduled replay. Without
 * it, a clip authored to loop in the editor (rather than play once and
 * settle) never stops on its own — it just keeps looping for the entire gap
 * until the next trigger calls `stop()` right before replaying it, which
 * reads as the clip never having stopped at all.
 */
export function useRandomOverlay(
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

/**
 * Robu's one-shot greeting wave — screen 1 plays this right after the intro
 * finishes (see `trigger`): the boot-up "splash screen" state machine
 * (RobuMascot) only covers the entrance itself, and this "hi " clip is what
 * actually plays once the "Hi, I am robu!" bubble is about to show. Reading
 * `rive.animationNames` at trigger time (rather than hardcoding one name)
 * also keeps the old rig's two theme `.riv` files working — one had a
 * complete "hii" timeline, the other only a "hii start"/"hii end" bookend
 * pair — falling all the way through to a no-op (Robu just stays on the
 * ambient loop) only if none of these three shapes exist on the loaded file.
 */
export function useGreetingOverlay(rive: RiveInstance | null, trigger: boolean) {
  useEffect(() => {
    if (!rive || !trigger) return;

    const names = rive.animationNames;
    if (names.includes("hi ")) {
      rive.stop("hi ");
      rive.play("hi ");
      return;
    }

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
 * keeps `speak` playing for as long as `talking` is true, and
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
  useRandomOverlay(rive, EYEBLINK_ANIMATIONS, EYEBLINK_MIN_MS, EYEBLINK_MAX_MS, EYEBLINK_HOLD_MS);
  useRandomOverlay(rive, EAR_ANIMATIONS, EAR_MIN_MS, EAR_MAX_MS);

  return (
    <div className={className}>
      <RiveComponent className="absolute top-10 right-20 h-[100px] w-[100px]" />
    </div>
  );
}
