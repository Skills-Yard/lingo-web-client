"use client";

import { useEffect, useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { EventType, Layout, Fit, Alignment, type Event as RiveEvent } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";
import {
  useAmbientLoop,
  useGreetingOverlay,
  usePeriodicOverlay,
  useTalkingMouth,
} from "./RobuEyeBlink";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `orbi.riv`'s "Artboard 1" carries both the one-shot boot-up intro AND the
// same ambient idle/eyeblink set `<RobuEyeBlink>` drives elsewhere (see
// ROBU_RIVE_SRC — it's the one `.riv` for every Robu instance in the app),
// so this one file/instance can carry Robu's *entire* time on screen:
// intro, then the ambient loop. RobuStage renders only this component for
// its one persistent mascot, for the whole session, instead of swapping to
// a different component/instance once the intro finishes. That swap used to
// be the actual source of a visible "cut" on the handoff — it forced a
// fresh canvas to mount (its own decode delay) showing a completely
// different first frame, at the exact instant the shrink to Robu's normal
// size also kicked in. With one instance for good, only the shrink itself
// (RobuStage's own width/height animation) is ever visible; the character
// underneath never cuts to a different canvas.
const ARTBOARD = "Artboard 1";

// The intro plays as three chained one-shot clips rather than a single
// timeline: an expression, then the face transitioning into "loading", then
// back out of it (`LOADING_TO_FACE`) before idle takes over below —
// without that last step, idle's first frame would pop in mid "loading"
// instead of settling naturally. Each name is confirmed byte-for-byte
// against the `.riv`'s own length-prefixed string table (same technique
// used on the old rig's oddly-spaced timeline names).
const INTRO_STEPS = ["Mouth_expression", "Face_to_loading", "Loading_to_face"] as const;

// Ambient loop once the intro is done — same names, same shape, as
// RobuEyeBlink's own ambient loop (see its exported hooks), since both
// components now share this one `.riv`. Note the trailing space — that's
// the clip's actual name in the file (confirmed the same way as above).
const BASE_ANIMATIONS = ["idle "];
// `orbi.riv` has no dedicated ear-wiggle clip (the old rig's `ears`) — Robu
// just stays on the ambient loop above for that beat instead.
const EYEBLINK_ANIMATION = "eye blink 2";
const EYEBLINK_INTERVAL_MS = 5000;

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuMascotProps {
  className?: string;
  /** Fired once the one-shot intro sequence has played through (or
   * immediately, if `skipIntro` is set). This is also the exact moment the
   * ambient idle/eyeblink loop below takes over. */
  onIntroComplete: () => void;
  /** Skip the one-shot intro and start straight in the ambient loop — for a
   * caller that's already shown Robu's intro once and is mounting a fresh
   * canvas instance anyway (a full remount elsewhere in the tree), where
   * replaying the intro would read as Robu re-entering from scratch instead
   * of picking back up. Default (false) is every normal appearance of Robu,
   * which still gets the intro. */
  skipIntro?: boolean;
  /** True while any heading/bubble text is actively being typed out
   * somewhere in the flow (see RobuTalkingContext) — plays Robu's
   * mouth-talking overlay for exactly that span, on top of the ambient loop
   * below. */
  talking?: boolean;
  /** True while Robu should be playing his one-shot greeting wave on top of
   * the ambient loop — screen 1 sets this once its own entrance-complete
   * flag flips true, so the wave plays right after the intro finishes. Only
   * fires again on a later false->true edge (e.g. leaving and coming back to
   * that screen) — see `useGreetingOverlay`. */
  greet?: boolean;
}

/**
 * The one and only Robu canvas for the whole flow (see RobuStage) — plays
 * the intro, then settles into an ambient loop, all on one Rive instance
 * that lives for as long as Robu is on screen. `onIntroComplete` lets
 * CoverScreen sync its own choreography (shrinking Robu, revealing his "Hi,
 * I am robu!" bubble) to the moment the intro actually finishes.
 */
export function RobuMascot({
  className,
  onIntroComplete,
  skipIntro = false,
  talking = false,
  greet = false,
}: RobuMascotProps) {
  // Gates the ambient hooks below so they only start driving `rive` once the
  // intro is done — before that, `useAmbientLoop`/`usePeriodicOverlay` just
  // see `null` and do nothing (both bail out immediately on a null rive).
  // Starts already-true when skipping the intro, since there's no `Stop`
  // event coming to flip it.
  const [ambientReady, setAmbientReady] = useState(skipIntro);
  // Which step of INTRO_STEPS is currently playing — advanced by matching
  // the *name* of whatever just stopped, since three one-shot clips are
  // chained back to back and only the last one's Stop means "intro done".
  const introStepRef = useRef(0);

  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: skipIntro ? BASE_ANIMATIONS : INTRO_STEPS[0],
    autoplay: true,
    layout: LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;

    if (skipIntro) {
      // Nothing one-shot is playing to wait on — go straight to "intro done".
      onIntroComplete();
      return;
    }

    introStepRef.current = 0;

    const handleStop = (event: RiveEvent) => {
      const stopped = event.data;
      const names = Array.isArray(stopped)
        ? stopped
        : typeof stopped === "string"
          ? [stopped]
          : [];
      // Ignore Stop events for anything other than the step we're actually
      // waiting on (e.g. the ambient hooks' own stop()/play() calls once
      // they take over below).
      if (!names.includes(INTRO_STEPS[introStepRef.current])) return;

      introStepRef.current += 1;
      if (introStepRef.current < INTRO_STEPS.length) {
        rive.play(INTRO_STEPS[introStepRef.current]);
        return;
      }

      rive.off(EventType.Stop, handleStop);
      setAmbientReady(true);
      onIntroComplete();
    };
    rive.on(EventType.Stop, handleStop);
    return () => rive.off(EventType.Stop, handleStop);
  }, [rive, onIntroComplete, skipIntro]);

  useAmbientLoop(ambientReady ? rive : null, BASE_ANIMATIONS);
  usePeriodicOverlay(ambientReady ? rive : null, EYEBLINK_ANIMATION, EYEBLINK_INTERVAL_MS);
  // Gated on `ambientReady` same as the overlay above — the one-shot intro
  // should never be interrupted by a talking cue that fires before it's
  // even settled into the ambient loop.
  useTalkingMouth(ambientReady ? rive : null, talking);
  useGreetingOverlay(ambientReady ? rive : null, greet);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
