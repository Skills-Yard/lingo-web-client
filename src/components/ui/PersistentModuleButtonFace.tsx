"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  getModuleButtonHost,
  pressModuleButton,
  setModuleButtonStretch,
  sweepModuleButtonShine,
  writeModuleButton,
} from "@/lib/rive/moduleButtonHost";
import { BUTTON, MODULE_BUTTON } from "@/lib/rive/runtime";
import type { AnswerResult } from "./RiveProgressBar";

/** The slot's size has settled once it hasn't changed for this long. */
const RESIZE_SETTLE_MS = 100;

/** A disabled button always looks disabled (a matching pair is an answer, but
 * the screen isn't done yet). Otherwise a checked answer sets the correct / wrong
 * art, and with none the button is at rest, in its `light` art if asked for. */
const pickState = (disabled: boolean, answer: AnswerResult | null, light: boolean) => {
  const { state } = MODULE_BUTTON;
  if (disabled) return state.disabled;
  if (answer) return answer.correct ? state.correct : state.wrong;
  return light ? state.light : state.enabled;
};

type PersistentModuleButtonFaceProps = {
  /** Written into the artboard's `label`; `""` leaves its text empty so the
   * caller can overlay richer content (e.g. an icon) in HTML instead. */
  label: string;
  /** Bumped by the caller on every click — each change plays the press clip. */
  pressCount: number;
  shine: boolean;
  disabled?: boolean;
  /** The latest checked answer — `buttonState` correct / wrong. */
  answer?: AnswerResult | null;
  /** At rest, the white art instead of the green. */
  light?: boolean;
  /** The artwork is stretched to fill the slot instead of fitted inside it. */
  stretch?: boolean;
};

/** The session's one module button (see `moduleButtonHost`), moved into this
 * slot — fills its parent. Moving to another screen keeps the same artboard on
 * screen; only its data changes. */
export function PersistentModuleButtonFace({
  label,
  pressCount,
  shine,
  disabled = false,
  answer = null,
  light = false,
  stretch = false,
}: PersistentModuleButtonFaceProps) {
  const slot = useRef<HTMLDivElement>(null);
  const state = pickState(disabled, answer, light);

  // Layout effects, so this screen's label and state are written before it
  // first paints: the button never shows the last screen's (a leftover correct
  // / wrong state included).
  useLayoutEffect(() => {
    writeModuleButton({ label, state });
  }, [label, state]);

  useLayoutEffect(() => {
    setModuleButtonStretch(stretch);
  }, [stretch]);

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getModuleButtonHost();
    element.appendChild(shared.element);
    const resize = () => shared.rive?.resizeDrawingSurfaceToCanvas();
    resize();
    // Resizing wipes the canvas, and Rive can't redraw until its next frame, so
    // doing it on each step of a size transition (the button growing as the hint
    // leaves) leaves the button blank until the end. Meanwhile the browser scales
    // the last drawing with the slot; the sharp one follows once the size settles.
    let settle: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(settle);
      settle = setTimeout(resize, RESIZE_SETTLE_MS);
    });
    observer.observe(element);
    // The stage is scaled as one piece, which changes the canvas's size on
    // screen without changing its layout size — so the window is watched too.
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!shine) return;
    sweepModuleButtonShine();
    const timer = window.setInterval(sweepModuleButtonShine, BUTTON.shineEveryMs);
    return () => window.clearInterval(timer);
  }, [shine]);

  useEffect(() => {
    if (pressCount > 0) pressModuleButton();
  }, [pressCount]);

  return <div ref={slot} aria-hidden className="pointer-events-none absolute inset-0" />;
}
