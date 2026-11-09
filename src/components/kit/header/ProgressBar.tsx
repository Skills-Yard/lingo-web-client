"use client";

import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
import { Artboard } from "../artboard/Artboard";
import { ARTBOARDS } from "../artboard/presets";
import type { AnswerResult } from "../types";

export type ProgressBarProps = {
  /** The screen the learner is on (1-based) of `total`. */
  step?: number;
  total?: number;
  /** The fill in percent (0-100), when there is no step. */
  value?: number;
  /** The latest checked answer: the bar cheers a right one and winces at a wrong one. */
  answer?: AnswerResult | null;
  /**
   * `true` (default): the session's one bar, moved from screen to screen; it tweens its fill as the
   * step changes, but only one can be on a page. `false`: a bar of its own (its fill jumps, not tweens).
   */
  persistent?: boolean;
  className?: string;
};

/** The lesson's progress bar (a Rive artboard). */
export function ProgressBar({ step, total, value, answer = null, persistent = true, className = "w-full" }: ProgressBarProps) {
  const fill = value ?? (step !== undefined && total ? (step / total) * 100 : 0);
  const from = step !== undefined && total ? ((step - 1) / total) * 100 : undefined;
  if (persistent) return <PersistentProgressBar value={fill} from={from} answer={answer} className={className} />;
  return (
    <Artboard
      {...ARTBOARDS["progress-bar"]}
      properties={{ progress: fill }}
      trigger={answer ? { name: answer.correct ? "correct" : "wrong", id: answer.id } : null}
      label={`Progress ${Math.round(fill)}%`}
      className={className}
    />
  );
}
