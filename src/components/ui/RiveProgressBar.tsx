"use client";

import { useEffect, useRef, useState } from "react";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { applyCanvasBleed } from "@/lib/rive/bleed";
import { PROGRESS_BAR } from "@/lib/rive/runtime";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** Until the artboard's real size is read. */
const FALLBACK_ASPECT = 8;
const { bleed } = PROGRESS_BAR;
const TWEEN_MS = 700;
const TWEEN_DELAY_MS = 150;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** A checked answer. A new `id` fires the trigger again, even for the same result.
 * `partial`: a right answer with more to come on its screen (a matching pair that
 * isn't the last), which doesn't yet grow the module's run (see `moduleStreak`). */
export type AnswerResult = { id: number; correct: boolean; partial?: boolean };

type RiveProgressBarProps = {
  /** Fill, 0-100 (%). */
  value: number;
  /** Where the fill starts, when the bar mounts mid-way (default: `value`). */
  from?: number;
  /** Fires the view model's `correct` / `wrong` trigger when it changes. */
  answer?: AnswerResult | null;
  className?: string;
};

/** `progressBar.riv`'s "LESSON_ProgressBar" artboard playing `ProgressBar_SM`, its
 * `progress` property set to `value`. Give it a width; the height follows the artboard. */
export function RiveProgressBar({ value, from, answer = null, className = "" }: RiveProgressBarProps) {
  const [aspect, setAspect] = useState(FALLBACK_ASPECT);
  const { rive, canvas, RiveComponent } = useRive({
    src: PROGRESS_BAR.src,
    artboard: PROGRESS_BAR.artboard,
    stateMachine: PROGRESS_BAR.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT,
  });

  // The artboard's own proportions set the bar's height from the width the
  // caller gives it, so it is never stretched.
  useEffect(() => {
    if (!rive) return;
    const { minX, maxX, minY, maxY } = rive.bounds;
    if (maxY > minY) setAspect((maxX - minX) / (maxY - minY));
  }, [rive]);

  // The canvas is bigger than the bar by the bleed on every side, so effects
  // past the artboard aren't clipped.
  useEffect(() => {
    if (!rive || !canvas) return;
    return applyCanvasBleed(rive, canvas, bleed, PROGRESS_BAR.trackInset);
  }, [rive, canvas]);

  // The fill the bar last showed. A change of `value` is tweened from here
  // (the property itself only jumps), so the fill visibly grows or shrinks.
  const shown = useRef(from ?? value);
  useEffect(() => {
    if (!rive) return;
    const target = Math.min(100, Math.max(0, value));
    const show = (fill: number) => {
      shown.current = fill;
      const property = rive.viewModelInstance?.number(PROGRESS_BAR.property);
      if (property) property.value = fill;
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
    <div aria-hidden className={`pointer-events-none relative ${className}`} style={{ aspectRatio: aspect }}>
      <RiveComponent
        style={{
          position: "absolute",
          left: -bleed,
          top: -bleed,
          width: `calc(100% + ${2 * bleed}px)`,
          height: `calc(100% + ${2 * bleed}px)`,
        }}
      />
    </div>
  );
}
