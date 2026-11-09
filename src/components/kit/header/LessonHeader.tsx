"use client";

import type { ReactNode } from "react";
import { BatteryMeter } from "./BatteryMeter";
import { CloseButton } from "./CloseButton";
import { ProgressBar } from "./ProgressBar";
import type { AnswerResult } from "../types";

export type LessonHeaderProps = {
  /** The screen the learner is on (1-based) of `total`: sets the progress bar. */
  step: number;
  total: number;
  onClose?: () => void;
  /** The latest checked answer, for the bar's reaction. */
  answer?: AnswerResult | null;
  /** Shows the battery at the right end (default). */
  showBattery?: boolean;
  /** Arriving at this screen spends its share of the battery. Off for a header that is only shown. */
  chargeBattery?: boolean;
  /** `false`: the bar and battery are the header's own, so more than one header can be on a page (see `ProgressBar`). */
  persistent?: boolean;
  /** Anything else for the right end, after the battery (a sound button). */
  trailing?: ReactNode;
  className?: string;
};

/**
 * The top row of a lesson screen: the cross, the progress bar between, and the
 * battery with what is left of it. It fills the width it is given.
 */
export function LessonHeader({ step, total, onClose, answer = null, showBattery = true, chargeBattery = false, persistent = true, trailing, className = "" }: LessonHeaderProps) {
  return (
    <header className={`flex h-[30px] w-full items-end gap-[17px] px-4 select-none ${className}`}>
      <CloseButton onClick={onClose} />
      <div className="flex h-[20.84px] min-w-0 flex-1 items-center justify-center">
        <ProgressBar step={step} total={total} answer={answer} persistent={persistent} className="w-full max-w-[480px]" />
      </div>
      {showBattery && <BatteryMeter chargeForStep={chargeBattery ? step : undefined} persistent={persistent} />}
      {trailing}
    </header>
  );
}
