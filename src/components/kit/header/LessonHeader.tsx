"use client";

import type { ReactNode } from "react";
import { BatteryMenu } from "@/components/onboarding/BatteryMenu";
import { EDGE, RAISED_SMALL } from "@/components/ui/raised";
import { BatteryMeter } from "./BatteryMeter";
import { CloseButton } from "./CloseButton";
import { ProgressBar } from "./ProgressBar";
import type { AnswerResult } from "../types";

/** The battery's face: the close button's, a little wider than the battery and its count, which the negative margins take back so the row does not move. */
const BATTERY_FACE = `-mx-1.5 -my-1 block rounded-[10px] bg-white px-1.5 py-1 dark:bg-[#15181E] ${RAISED_SMALL} ${EDGE.khaki}`;

export type LessonHeaderProps = {
  /** The screen the learner is on (1-based) of `total`: sets the progress bar. */
  step: number;
  total: number;
  /** The cross: leaves the lesson. */
  onClose?: () => void;
  /** The previous screen. Not shown anywhere: it is the Back of the hidden dev panel that opens when the battery is held (default: `onClose`). */
  onPrevious?: () => void;
  /** The latest checked answer, for the bar's reaction. */
  answer?: AnswerResult | null;
  /** Shows the battery at the right end (default). */
  showBattery?: boolean;
  /**
   * The screen whose share of the battery is spent when this header appears. Leave it out for a header that is only
   * shown; give it where the bar's `step` is not the screen to pay for (a question asked again is already paid for).
   */
  batteryStep?: number;
  /** `false`: the bar and battery are the header's own, so more than one header can be on a page (see `ProgressBar`). */
  persistent?: boolean;
  /** Anything else for the right end, after the battery (a sound button). */
  trailing?: ReactNode;
  className?: string;
};

/**
 * The top row of a lesson screen, the only one there is: the cross, the progress bar between, and the
 * battery with what is left of it. It fills the width it is given (16px in from each side); the screen
 * frame (`ScreenFrame`) places it. A tap on the battery opens the Energy screen, a hold the hidden dev panel.
 */
export function LessonHeader({ step, total, onClose, onPrevious, answer = null, showBattery = true, batteryStep, persistent = true, trailing, className = "" }: LessonHeaderProps) {
  return (
    <header className={`flex h-[30px] w-full items-end gap-[17px] px-4 select-none ${className}`}>
      <CloseButton onClick={onClose} />
      <div className="flex h-[20.84px] min-w-0 flex-1 items-center justify-center">
        <ProgressBar step={step} total={total} answer={answer} persistent={persistent} className="w-full max-w-[480px]" />
      </div>
      {showBattery && (
        // Each screen's `step` spends its share of the battery.
        <BatteryMenu className="relative shrink-0" buttonClassName={BATTERY_FACE} onBack={onPrevious ?? onClose}>
          <BatteryMeter chargeForStep={batteryStep} persistent={persistent} />
        </BatteryMenu>
      )}
      {trailing}
    </header>
  );
}
