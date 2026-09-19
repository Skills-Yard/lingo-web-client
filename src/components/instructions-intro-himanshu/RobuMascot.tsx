"use client";

import { useEffect, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";
import {
  useAmbientLoop,
  useGreetingOverlay,
  useRandomOverlay,
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

// The boot-up sequence (Mouth_expression -> Face_to_loading ->
// Loading_to_face -> idle) is authored *inside* this state machine as
// automatic (no-input) transitions, so playing the state machine plays the
// whole thing through on its own — no manual chaining of individual
// timelines needed.
const STATE_MACHINE = "Robu-StateMachine";

// How long that boot sequence takes to settle into its own idle state,
// measured against the actual timeline lengths in the .riv — the state
// machine doesn't expose a "boot done" event to wait on instead, so this is
// the cue for handing off to the overlays below and telling the caller
// (`onIntroComplete`) the intro has finished.
const INTRO_SETTLE_MS = 3200;

// A caller that skips the intro entirely (see `skipIntro`) can't jump the
// state machine straight to its idle state (it has no inputs to do that
// with), so it bypasses the state machine altogether and plays the raw
// `idle ` timeline directly instead — same mechanism `<RobuEyeBlink>` itself
// uses, via the same `useAmbientLoop` watchdog.
const BASE_ANIMATIONS = ["idle "];

const EYEBLINK_ANIMATIONS = ["eye blink 2"];
const EYEBLINK_MIN_MS = 3000;
const EYEBLINK_MAX_MS = 6000;

const GLANCE_ANIMATIONS = ["eyes left & right", "eys left "];
const GLANCE_MIN_MS = 5000;
const GLANCE_MAX_MS = 10000;

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
   * mouth-movement overlay for exactly that span, on top of the ambient loop
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
  // Gates the overlay hooks below so they only start driving `rive` once the
  // intro has settled — before that, they just see `null` and do nothing
  // (all three bail out immediately on a null rive). Starts already-true
  // when skipping the intro, since there's no settle to wait on.
  const [ambientReady, setAmbientReady] = useState(skipIntro);

  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    autoplay: true,
    layout: LAYOUT,
    // See BASE_ANIMATIONS/STATE_MACHINE above for why these are mutually
    // exclusive rather than both always passed.
    ...(skipIntro ? { animations: BASE_ANIMATIONS } : { stateMachines: STATE_MACHINE }),
  });

  useEffect(() => {
    if (!rive) return;

    if (skipIntro) {
      // Nothing one-shot is playing to wait on — go straight to "intro done".
      onIntroComplete();
      return;
    }

    const timer = window.setTimeout(() => {
      setAmbientReady(true);
      onIntroComplete();
    }, INTRO_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [rive, onIntroComplete, skipIntro]);

  // Only relevant for the `skipIntro` path above — a no-op against `null`
  // otherwise (the normal path's ambient loop lives inside the state
  // machine itself, not a raw timeline this hook needs to watchdog).
  useAmbientLoop(skipIntro && ambientReady ? rive : null, BASE_ANIMATIONS);
  useRandomOverlay(ambientReady ? rive : null, EYEBLINK_ANIMATIONS, EYEBLINK_MIN_MS, EYEBLINK_MAX_MS);
  useRandomOverlay(ambientReady ? rive : null, GLANCE_ANIMATIONS, GLANCE_MIN_MS, GLANCE_MAX_MS);
  // Gated on `ambientReady` same as the overlays above — the one-shot intro
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
