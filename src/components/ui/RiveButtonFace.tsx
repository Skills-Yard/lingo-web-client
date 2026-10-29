"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive } from "@rive-app/canvas";
import type { AnswerResult } from "./RiveProgressBar";
import { PersistentModuleButtonFace } from "./PersistentModuleButtonFace";
import { configureRiveRuntime, BUTTON } from "@/lib/rive/runtime";

configureRiveRuntime();

/**
 * `btn-click.riv` — the brand-tone Button3D's artwork. The "onboarding"
 * variant is artboard "OnboardingButton" / "Onboarding_SM", drawn per button
 * (below). The "module" variant is artboard "ModuleButton" / "ModuleButton_SM":
 * every module screen shares one instance of it, so it never reloads between
 * screens (see PersistentModuleButtonFace). Either way the bound view model's
 * `shine` and `click` triggers sweep the highlight and play the press, and its
 * `label` string drives the button's text. The file also holds other
 * artboards, hence the explicit `artboard` below.
 */
export const RIVE_BUTTON_SRC = BUTTON.src;
export const RIVE_BUTTON_W = BUTTON.width;
export const RIVE_BUTTON_H = BUTTON.height;
export type RiveButtonVariant = "onboarding" | "module";
const ONBOARDING_ARTBOARD = "OnboardingButton";
const ONBOARDING_STATE_MACHINE = "Onboarding_SM";
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

/** The onboarding artboard, loaded afresh by every button. */
function OnboardingButtonFace({ label, pressCount, shine }: Pick<RiveButtonFaceProps, "label" | "pressCount" | "shine">) {
  // Fetch starts as early as the first button renders; later instances reuse
  // the browser's cached copy. `crossOrigin: "anonymous"` matches the
  // credentials mode of Rive's own `fetch()`, or the browser ignores the
  // preload and downloads the file a second time.
  preload(RIVE_BUTTON_SRC, { as: "fetch", crossOrigin: "anonymous" });

  const { rive, RiveComponent } = useRive({
    src: RIVE_BUTTON_SRC,
    artboard: ONBOARDING_ARTBOARD,
    stateMachine: ONBOARDING_STATE_MACHINE,
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
    const text = rive.viewModelInstance?.string(BUTTON.labelProperty);
    if (text) text.value = label;
    rive.drawFrame();
    // drawFrame() paints on the next animation frame, so reveal after it.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setLabelDrawn(true)));
    return () => cancelAnimationFrame(raf);
  }, [rive, label]);

  useEffect(() => {
    if (!rive || !shine) return;
    const sweep = () => {
      fireTrigger(rive, BUTTON.shineTrigger);
    };
    sweep();
    const timer = window.setInterval(sweep, BUTTON.shineEveryMs);
    // Timer-only cleanup: calling into `rive` here would also run on
    // unmount, after Rive may already have deleted the artboard.
    return () => window.clearInterval(timer);
  }, [rive, shine]);

  useEffect(() => {
    if (!rive || pressCount === 0) return;
    fireTrigger(rive, BUTTON.clickTrigger);
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
