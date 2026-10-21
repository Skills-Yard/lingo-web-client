"use client";

import { useEffect, useRef } from "react";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { hexRiveSource } from "@/lib/rive/hexFile";
import { PROGRESS_BAR } from "@/lib/rive/runtime";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** The bar's height follows from the width the caller gives it, so it is never stretched. */
const ASPECT = PROGRESS_BAR.artboardWidth / PROGRESS_BAR.artboardHeight;
const TWEEN_MS = 700;
const TWEEN_DELAY_MS = 150;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** A checked answer. A new `id` fires the trigger again, even for the same result. */
export type AnswerResult = { id: number; correct: boolean };

type RiveProgressBarProps = {
  /** Fill, 0-100 (%). */
  value: number;
  /** Where the fill starts, when the bar mounts mid-way (default: `value`). */
  from?: number;
  /** Fires the view model's `correct` / `wrong` trigger when it changes. */
  answer?: AnswerResult | null;
  className?: string;
};

/** `hex.riv`'s "Lesson_Progressbar" artboard playing `progressBar_SM`, its
 * `progress` property set to `value`. Give it a width; the height follows the artboard. */
export function RiveProgressBar({ value, from, answer = null, className = "" }: RiveProgressBarProps) {
  const { rive, RiveComponent } = useRive({
    ...hexRiveSource(),
    artboard: PROGRESS_BAR.artboard,
    stateMachine: PROGRESS_BAR.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT,
  });

  // Widen the artboard so its track isn't clipped (see PROGRESS_BAR).
  useEffect(() => {
    if (rive) Object.assign(rive, {
      artboardWidth: PROGRESS_BAR.artboardWidth,
      artboardHeight: PROGRESS_BAR.artboardHeight,
    });
  }, [rive]);

  // The fill the bar last showed. A change of `value` is tweened from here
  // (the property itself only jumps), so the fill visibly grows or shrinks.
  const shown = useRef(from ?? value);
  useEffect(() => {
    if (!rive) return;
    const target = Math.min(100, Math.max(0, value));
    const input = rive
      .stateMachineInputs(PROGRESS_BAR.stateMachine)
      ?.find((candidate) => candidate.name === PROGRESS_BAR.property);
    const show = (fill: number) => {
      shown.current = fill;
      const property = rive.viewModelInstance?.number(PROGRESS_BAR.property);
      if (property) property.value = fill;
      else if (input) input.value = fill;
    };
    const start = shown.current;
    show(start);
    if (start === target) return;
    let frame = 0;
    const begin = performance.now() + TWEEN_DELAY_MS;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / TWEEN_MS));
      show(start + (target - start) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rive, value]);

  const answerId = answer?.id;
  const answerCorrect = answer?.correct;
  useEffect(() => {
    if (!rive || answerId === undefined) return;
    const name = answerCorrect ? PROGRESS_BAR.correctTrigger : PROGRESS_BAR.wrongTrigger;
    rive.viewModelInstance?.trigger(name)?.trigger();
  }, [rive, answerId, answerCorrect]);

  return (
    <div aria-hidden className={`pointer-events-none ${className}`} style={{ aspectRatio: ASPECT }}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
