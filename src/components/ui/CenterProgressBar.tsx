"use client";

import { RiveProgressBar, type AnswerResult } from "./RiveProgressBar";

type CenterProgressBarProps = {
  /** Fill, 0-100 (%). */
  value: number;
  from?: number;
  answer?: AnswerResult | null;
};

/** The same Rive progress bar as the header's, drawn in the middle of the screen. */
export function CenterProgressBar({ value, from, answer = null }: CenterProgressBarProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <RiveProgressBar value={value} from={from} answer={answer} className="w-64" />
    </div>
  );
}
