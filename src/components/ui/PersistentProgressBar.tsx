"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  fireAnswer,
  getProgressBarHost,
  lastShownFill,
  progressBarVersion,
  pulseCombo,
  subscribeProgressBar,
  writeProgress,
} from "@/lib/rive/progressBarHost";
import type { AnswerResult } from "./RiveProgressBar";

const TWEEN_MS = 700;
const TWEEN_DELAY_MS = 150;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

type PersistentProgressBarProps = {
  /** Fill, 0-100 (%). */
  value: number;
  /** Where the fill starts the very first time the bar is shown. */
  from?: number;
  /** Fires the view model's `correct` / `wrong` trigger when it changes. */
  answer?: AnswerResult | null;
  className?: string;
};

/** The session's one progress bar (see `progressBarHost`), moved into this
 * slot. Moving to another screen keeps it on screen and tweens its fill. */
export function PersistentProgressBar({ value, from, answer = null, className = "" }: PersistentProgressBarProps) {
  const slot = useRef<HTMLDivElement>(null);
  // Re-renders once the Rive file has loaded (and its size is known).
  useSyncExternalStore(subscribeProgressBar, progressBarVersion, () => 0);
  // Set after mount, so the server and the first client render agree.
  const [host, setHost] = useState<ReturnType<typeof getProgressBarHost> | null>(null);
  const rive = host?.rive ?? null;
  const loaded = host?.loaded ?? false;

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getProgressBarHost();
    element.appendChild(shared.element);
    shared.rive?.resizeDrawingSurfaceToCanvas();
    setHost(shared);
    const observer = new ResizeObserver(() => shared.rive?.resizeDrawingSurfaceToCanvas());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rive || !loaded) return;
    const target = Math.min(100, Math.max(0, value));
    const show = writeProgress;
    const start = lastShownFill() ?? from ?? target;
    show(start);
    if (start === target) return;
    pulseCombo();
    let frame = 0;
    const begin = performance.now() + TWEEN_DELAY_MS;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / TWEEN_MS));
      show(start + (target - start) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rive, loaded, value, from]);

  const answerId = answer?.id;
  const answerCorrect = answer?.correct;
  useEffect(() => {
    if (!rive || !loaded || answerId === undefined) return;
    fireAnswer(answerCorrect ?? false);
  }, [rive, loaded, answerId, answerCorrect]);

  return (
    <div
      ref={slot}
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{ aspectRatio: host?.aspect }}
    />
  );
}
