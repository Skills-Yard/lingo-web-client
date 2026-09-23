"use client";

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

// `orbi.riv`'s "Artboard 2" carries the ambient idle/eyeblink set
// `<RobuEyeBlink>` drives elsewhere too (see ROBU_RIVE_SRC — it's the one
// `.riv` for every Robu instance in the app). RobuStage renders only this
// component for its one persistent mascot, for the whole session, instead of
// swapping to a different component/instance for different moments — that
// swap used to be a source of a visible "cut" on handoff (a fresh canvas
// mounting, its own decode delay, a completely different first frame at the
// exact instant a shrink/reposition also kicked in). With one instance for
// good, only the shrink/reposition itself is ever visible; the character
// underneath never cuts to a different canvas.
//
// This does NOT include the boot-up splash sequence any more — that now
// lives entirely in `<RobuSplash>`, a separate, disposable canvas the caller
// swaps out for this component once the splash has had its moment. The
// splash's own "splash screen" state machine settles into a zoomed-in
// close-up framing rather than resetting to the normal full-body pose, so
// playing it on this persistent instance and handing off left the ambient
// loop visibly stuck zoomed in — seeding a fresh canvas here instead avoids
// that entirely, since this instance never touches that state machine.
const ARTBOARD = "Artboard 2";

const BASE_ANIMATIONS = ["idle "];

// Fixed 5s cadence rather than a random range — the blink clip loops in the
// editor (it doesn't settle back to open on its own), so without an explicit
// `holdMs` force-stop (see useRandomOverlay) it would just keep blinking for
// the entire gap until the next trigger, reading as never stopping at all.
const EYEBLINK_ANIMATIONS = ["both eye pupil blink "];
const EYEBLINK_MIN_MS = 5000;
const EYEBLINK_MAX_MS = 5000;
const EYEBLINK_HOLD_MS = 600;

// The ear flourish is randomized (not fixed-interval) so it reads as
// unscripted instead of metronomic, centered on the ~10s cadence asked for.
const EAR_ANIMATIONS = ["ear blink"];
const EAR_MIN_MS = 8000;
const EAR_MAX_MS = 12000;

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuMascotProps {
  className?: string;
  /** True while any heading/bubble text is actively being typed out
   * somewhere in the flow (see RobuTalkingContext) — plays Robu's
   * mouth-movement overlay for exactly that span, on top of the ambient loop
   * below. */
  talking?: boolean;
  /** True while Robu should be playing his one-shot greeting wave on top of
   * the ambient loop — screen 1 sets this once the splash sequence has
   * finished, so the wave plays right as its bubble shows. Only fires again
   * on a later false->true edge (e.g. leaving and coming back to that
   * screen) — see `useGreetingOverlay`. */
  greet?: boolean;
}

/**
 * The one and only Robu canvas for the whole flow (see RobuStage): the
 * ambient idle/eyeblink/ear loop, for as long as Robu is on screen. Always
 * live the instant it mounts — the caller (InstructionsIntroFlow) is what
 * decides *when* that mount happens, swapping in `<RobuSplash>` first for
 * screen 1's one-shot entrance and only mounting this once that's done.
 */
export function RobuMascot({
  className,
  talking = false,
  greet = false,
}: RobuMascotProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: BASE_ANIMATIONS,
    autoplay: true,
    layout: LAYOUT,
  });

  useAmbientLoop(rive, BASE_ANIMATIONS);
  useRandomOverlay(rive, EYEBLINK_ANIMATIONS, EYEBLINK_MIN_MS, EYEBLINK_MAX_MS, EYEBLINK_HOLD_MS);
  useRandomOverlay(rive, EAR_ANIMATIONS, EAR_MIN_MS, EAR_MAX_MS);
  useTalkingMouth(rive, talking);
  useGreetingOverlay(rive, greet);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
