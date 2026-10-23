"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive } from "@rive-app/canvas";
import type { AnswerResult } from "./RiveProgressBar";
import { configureRiveRuntime } from "@/lib/rive/runtime";

configureRiveRuntime();

/**
 * `btn-click.riv` — the brand-tone Button3D's artwork. The
 * "onboarding" variant is artboard "OnboardingButton" / "Onboarding_SM"; the
 * "module" variant is "ModuleButton" / "ModuleButton_SM" with `buttonState`
 * 4. Either way the bound view model's
 * `shine` and `click` triggers sweep the highlight and play the press, and its
 * `label` string drives the button's text. The file also holds other
 * artboards, hence the explicit `artboard` below.
 */
export const RIVE_BUTTON_SRC = "/animations/btn-click.riv?v=3";
export const RIVE_BUTTON_W = 371;
export const RIVE_BUTTON_H = 113;
export type RiveButtonVariant = "onboarding" | "module";
/** Both artboards share a `Button` view model (`shine`, `click`, `buttonState`, `label`). */
const VARIANTS: Record<RiveButtonVariant, { artboard: string; stateMachine: string; buttonState?: number }> = {
  onboarding: { artboard: "OnboardingButton", stateMachine: "Onboarding_SM" },
  module: { artboard: "ModuleButton", stateMachine: "ModuleButton_SM", buttonState: 4 },
};
const LABEL_PROPERTY = "label";
const SHINE_TRIGGER = "shine";
const CLICK_TRIGGER = "click";
/** Same cadence the old CSS shine used (`animate-button-shine`, 5s). */
const SHINE_EVERY_MS = 5000;
const DISABLED_BUTTON_STATE = 0;
const WRONG_BUTTON_STATE = 2;
const CORRECT_BUTTON_STATE = 3;
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Shown until the .riv has loaded (it's ~250 KB, mostly its embedded font),
// so the button never renders as an empty gap. The label only ever comes
// from Rive's own text run.
const PLACEHOLDER_SRC = "/images/polygon-btn/default-btn.png";

interface RiveButtonFaceProps {
  /** Written into the view model's `label`; `""` leaves the Rive text empty so
   * the caller can overlay richer content (e.g. an icon) in HTML instead. */
  label: string;
  /** Bumped by the caller on every click — each change plays the press clip. */
  pressCount: number;
  shine: boolean;
  variant?: RiveButtonVariant;
  /** Module variant only: swaps `buttonState` to its disabled art (0). */
  disabled?: boolean;
  /** Module variant only: the latest checked answer — `buttonState` 3 when correct, 2 when wrong. */
  answer?: AnswerResult | null;
}

/** Fires a trigger on the artboard's bound view model ("data"). */
function fireTrigger(rive: Rive, name: string) {
  rive.viewModelInstance?.trigger(name)?.trigger();
}

/** `undefined` (the onboarding variant) leaves `buttonState` untouched. */
function pickButtonState(enabledState: number | undefined, disabled: boolean, answer: AnswerResult | null) {
  if (enabledState === undefined) return undefined;
  if (answer) return answer.correct ? CORRECT_BUTTON_STATE : WRONG_BUTTON_STATE;
  return disabled ? DISABLED_BUTTON_STATE : enabledState;
}

/** The Rive-drawn face of Button3D's brand tone — fills its parent. */
export function RiveButtonFace({ label, pressCount, shine, variant = "onboarding", disabled = false, answer = null }: RiveButtonFaceProps) {
  const { artboard, stateMachine, buttonState: enabledState } = VARIANTS[variant];
  const buttonState = pickButtonState(enabledState, disabled, answer);
  // Fetch starts as early as the first button renders; later instances reuse
  // the browser's cached copy. `crossOrigin: "anonymous"` matches the
  // credentials mode of Rive's own `fetch()`, or the browser ignores the
  // preload and downloads the file a second time.
  preload(RIVE_BUTTON_SRC, { as: "fetch", crossOrigin: "anonymous" });

  const { rive, RiveComponent } = useRive({
    src: RIVE_BUTTON_SRC,
    artboard,
    stateMachine,
    autoBind: true,
    autoplay: true,
    layout: LAYOUT,
  });

  // True once the canvas has painted `label` itself. Until then the
  // placeholder stays up and the canvas stays hidden: on load Rive paints
  // the artboard's own default text first, so swapping the moment `rive`
  // exists would flash that frame between the placeholder and the real
  // label — visible every time a button mounts fresh (e.g. each screen on
  // /module1/combined, which remounts its whole flow per screen).
  const [labelDrawn, setLabelDrawn] = useState(false);

  // Nothing is animating when the label changes, so redraw explicitly —
  // setting the property alone doesn't repaint the canvas.
  useEffect(() => {
    if (!rive) return;
    const text = rive.viewModelInstance?.string(LABEL_PROPERTY);
    if (text) text.value = label;
    rive.drawFrame();
    // drawFrame() paints on the next animation frame, so reveal after it.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setLabelDrawn(true)));
    return () => cancelAnimationFrame(raf);
  }, [rive, label]);

  useEffect(() => {
    if (!rive || buttonState === undefined) return;
    const state = rive.viewModelInstance?.number("buttonState");
    if (state) state.value = buttonState;
  }, [rive, buttonState]);

  useEffect(() => {
    if (!rive || !shine) return;
    const sweep = () => {
      fireTrigger(rive, SHINE_TRIGGER);
    };
    sweep();
    const timer = window.setInterval(sweep, SHINE_EVERY_MS);
    // Timer-only cleanup: calling into `rive` here would also run on
    // unmount, after Rive may already have deleted the artboard.
    return () => window.clearInterval(timer);
  }, [rive, shine]);

  useEffect(() => {
    if (!rive || pressCount === 0) return;
    fireTrigger(rive, CLICK_TRIGGER);
  }, [rive, pressCount]);

  return (
    <>
      {/* Art only, no HTML label: text overlaid here never lines up with
          the text Rive then draws, so it read as a jump on every load. */}
      {!labelDrawn && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PLACEHOLDER_SRC}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        />
      )}
      <RiveComponent
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full ${labelDrawn ? "" : "opacity-0"}`}
      />
    </>
  );
}
