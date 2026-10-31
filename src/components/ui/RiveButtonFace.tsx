"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, EventType, type EventCallback, type Rive } from "@rive-app/canvas";
import type { AnswerResult } from "./RiveProgressBar";
import { PersistentModuleButtonFace } from "./PersistentModuleButtonFace";
import { configureRiveRuntime, BUTTON } from "@/lib/rive/runtime";
import { writeButtonStyle } from "@/lib/rive/buttonStyle";
import { applyArtboardBleed, artboardBleedBox } from "@/lib/rive/bleed";

configureRiveRuntime();

/**
 * The "AllButton" artboard of `progressBar.riv` — the brand-tone Button3D's
 * artwork. Its `switchStyle` number picks the look: the "onboarding" variant
 * (`BUTTON.style.onboarding`) is drawn per button (below); the "module" variant
 * (`BUTTON.style.module`) is one instance every module screen shares, so it never
 * reloads between screens (see PersistentModuleButtonFace). Either way the bound
 * view model's `shine` and `click` triggers sweep the highlight and play the press,
 * and its `label` string drives the button's text. The file also holds other
 * artboards, hence the explicit `artboard` below.
 */
export const RIVE_BUTTON_SRC = BUTTON.src;
export const RIVE_BUTTON_W = BUTTON.width;
export const RIVE_BUTTON_H = BUTTON.height;
export type RiveButtonVariant = "onboarding" | "module";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
/** Where the canvas sits in the button's box: past it by `BUTTON.bleed` on every side. */
const BLEED_BOX = artboardBleedBox(BUTTON, BUTTON.bleed);

// Shown until the .riv has loaded (it holds more than the button, so it is a
// few MB), so the button never renders as an empty gap. The label only ever
// comes from Rive's own text run.
const PLACEHOLDER_SRC = "/images/polygon-btn/default-btn.png";

interface RiveButtonFaceProps {
  /** Written into the view model's `label`; `""` leaves the Rive text empty so
   * the caller can overlay richer content (e.g. an icon) in HTML instead. */
  label: string;
  /** Bumped by the caller on every click — each change plays the press clip. */
  pressCount: number;
  shine: boolean;
  variant?: RiveButtonVariant;
  /** Module variant only: swaps `buttonState` to its disabled art. */
  disabled?: boolean;
  /** Module variant only: the latest checked answer — `buttonState` correct / wrong. */
  answer?: AnswerResult | null;
  /** Module variant only: stretch the artwork to fill the box rather than fit inside it. */
  stretch?: boolean;
}

/** Fires a trigger on the artboard's bound view model ("data"). */
function fireTrigger(rive: Rive, name: string) {
  rive.viewModelInstance?.trigger(name)?.trigger();
}

/** The Rive-drawn face of Button3D's brand tone — fills its parent. */
export function RiveButtonFace({ variant = "onboarding", disabled, answer, stretch, ...face }: RiveButtonFaceProps) {
  if (variant === "module") return <PersistentModuleButtonFace {...face} disabled={disabled} answer={answer} stretch={stretch} />;
  return <OnboardingButtonFace {...face} />;
}

/** The onboarding look of the artboard, loaded afresh by every button. */
function OnboardingButtonFace({ label, pressCount, shine }: Pick<RiveButtonFaceProps, "label" | "pressCount" | "shine">) {
  // Fetch starts as early as the first button renders; later instances reuse
  // the browser's cached copy. `crossOrigin: "anonymous"` matches the
  // credentials mode of Rive's own `fetch()`, or the browser ignores the
  // preload and downloads the file a second time.
  preload(RIVE_BUTTON_SRC, { as: "fetch", crossOrigin: "anonymous" });

  const { rive, canvas, RiveComponent } = useRive({
    src: RIVE_BUTTON_SRC,
    artboard: BUTTON.artboard,
    stateMachine: BUTTON.stateMachine,
    autoBind: true,
    autoplay: true,
    layout: LAYOUT,
  });

  // The canvas is bigger than the button by the bleed on every side, so what
  // the art draws past the artboard isn't clipped.
  useEffect(() => {
    if (!rive || !canvas) return;
    return applyArtboardBleed(rive, canvas, BUTTON, BUTTON.bleed);
  }, [rive, canvas]);

  // True once the canvas shows the finished button. Until then the
  // placeholder stays up and the canvas stays hidden: on load Rive paints
  // the artboard's own defaults first (its default text, in the module
  // look), so swapping the moment `rive` exists would flash that frame
  // between the placeholder and the real button — visible every time a
  // button mounts fresh (e.g. each screen on /module1/combined, which
  // remounts its whole flow per screen).
  const [revealed, setRevealed] = useState(false);

  // The artboard starts in the module look and morphs into the onboarding one
  // when switched, so the canvas stays hidden until that has played out
  // (which also leaves time for the label below to be painted). Counted in
  // Rive's own advance time, not the clock: a late frame can't cut it short.
  useEffect(() => {
    if (!rive) return;
    const instance = rive.viewModelInstance;
    if (instance) writeButtonStyle(instance, BUTTON.style.onboarding);
    let played = 0;
    const onAdvance: EventCallback = ({ data }) => {
      played += Number(data);
      if (played < BUTTON.styleSwitchSeconds) return;
      rive.off(EventType.Advance, onAdvance);
      setRevealed(true);
    };
    rive.on(EventType.Advance, onAdvance);
    return () => rive.off(EventType.Advance, onAdvance);
  }, [rive]);

  // Nothing is animating when the label changes, so redraw explicitly —
  // setting the property alone doesn't repaint the canvas.
  useEffect(() => {
    if (!rive) return;
    const text = rive.viewModelInstance?.string(BUTTON.labelProperty);
    if (text) text.value = label;
    rive.drawFrame();
  }, [rive, label]);

  useEffect(() => {
    if (!rive || !revealed || !shine) return;
    const sweep = () => {
      fireTrigger(rive, BUTTON.shineTrigger);
    };
    sweep();
    const timer = window.setInterval(sweep, BUTTON.shineEveryMs);
    // Timer-only cleanup: calling into `rive` here would also run on
    // unmount, after Rive may already have deleted the artboard.
    return () => window.clearInterval(timer);
  }, [rive, revealed, shine]);

  useEffect(() => {
    if (!rive || pressCount === 0) return;
    fireTrigger(rive, BUTTON.clickTrigger);
  }, [rive, pressCount]);

  return (
    <>
      {/* Art only, no HTML label: text overlaid here never lines up with
          the text Rive then draws, so it read as a jump on every load. */}
      {!revealed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PLACEHOLDER_SRC}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        />
      )}
      {/* A `style`, not a `className`: `RiveComponent` drops its `style` whenever it has one. */}
      <RiveComponent
        aria-hidden
        style={{ position: "absolute", pointerEvents: "none", opacity: revealed ? 1 : 0, ...BLEED_BOX }}
      />
    </>
  );
}
