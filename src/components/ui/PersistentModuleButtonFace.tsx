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

/** A checked answer sets the correct / wrong art; otherwise the button is at
 * rest, enabled or disabled. */
const pickState = (disabled: boolean, answer: AnswerResult | null) => {
  const { state } = MODULE_BUTTON;
  if (answer) return answer.correct ? state.correct : state.wrong;
  return disabled ? state.disabled : state.enabled;
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
  stretch = false,
}: PersistentModuleButtonFaceProps) {
  const slot = useRef<HTMLDivElement>(null);
  const state = pickState(disabled, answer);

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
    // The stage is scaled as one piece, which changes the canvas's size on
    // screen without changing its layout size — so the window is watched too.
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    window.addEventListener("resize", resize);
    return () => {
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
