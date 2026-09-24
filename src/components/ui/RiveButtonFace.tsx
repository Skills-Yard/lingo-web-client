"use client";

import { useEffect } from "react";
import { preload } from "react-dom";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime } from "@/lib/rive/runtime";

configureRiveRuntime();

/**
 * `btn-click.riv` — the brand-tone Button3D's artwork. Artboard "Button"
 * (371x113) holds the green slab, a `ButtonText` text object whose run is
 * named `buttonName` (the only exported name, so the label can be set at
 * runtime), and three one-shot clips: "Shine" (0.67s), "Button Pressing"
 * (0.33s — the same length as Button3D's CLICK_DELAY_MS) and "Timeline 1"
 * (unused). The file has no state machine, so both clips are played by hand.
 */
export const RIVE_BUTTON_SRC = "/animations/btn-click.riv";
export const RIVE_BUTTON_W = 371;
export const RIVE_BUTTON_H = 113;
const ARTBOARD = "Button";
const TEXT_RUN = "buttonName";
const SHINE_ANIMATION = "Shine";
const PRESS_ANIMATION = "Button Pressing";
/** Same cadence the old CSS shine used (`animate-button-shine`, 5s). */
const SHINE_EVERY_MS = 5000;
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Shown until the .riv has loaded (it's ~0.9 MB, mostly its embedded font),
// so the button never renders as an empty gap.
const PLACEHOLDER_SRC = "/images/polygon-btn/default-btn.png";

interface RiveButtonFaceProps {
  /** Written into the `buttonName` run; `""` leaves the Rive text empty so
   * the caller can overlay richer content (e.g. an icon) in HTML instead. */
  label: string;
  /** Bumped by the caller on every click — each change plays the press clip. */
  pressCount: number;
  shine: boolean;
}

/** The Rive-drawn face of Button3D's brand tone — fills its parent. */
export function RiveButtonFace({ label, pressCount, shine }: RiveButtonFaceProps) {
  // Fetch starts as early as the first button renders; later instances reuse
  // the browser's cached copy.
  preload(RIVE_BUTTON_SRC, { as: "fetch" });

  const { rive, RiveComponent } = useRive({
    src: RIVE_BUTTON_SRC,
    artboard: ARTBOARD,
    autoplay: false,
    layout: LAYOUT,
  });

  // Nothing is animating when the label changes, so redraw explicitly —
  // setting the run's text alone doesn't repaint the canvas.
  useEffect(() => {
    if (!rive) return;
    rive.setTextRunValue(TEXT_RUN, label);
    rive.drawFrame();
  }, [rive, label]);

  useEffect(() => {
    if (!rive || !shine) return;
    const sweep = () => {
      rive.stop(SHINE_ANIMATION);
      rive.play(SHINE_ANIMATION);
    };
    sweep();
    const timer = window.setInterval(sweep, SHINE_EVERY_MS);
    // Timer-only cleanup: calling into `rive` here would also run on
    // unmount, after Rive may already have deleted the artboard.
    return () => window.clearInterval(timer);
  }, [rive, shine]);

  useEffect(() => {
    if (!rive || pressCount === 0) return;
    rive.stop(PRESS_ANIMATION);
    rive.play(PRESS_ANIMATION);
  }, [rive, pressCount]);

  return (
    <>
      {!rive && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PLACEHOLDER_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          />
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-xl font-medium text-primary-foreground"
          >
            {label}
          </span>
        </>
      )}
      <RiveComponent aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </>
  );
}
