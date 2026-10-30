"use client";

import { useEffect, useState } from "react";
import { batteryCount, useBattery } from "@/components/home/batteryStore";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
import { BatteryMenu } from "./BatteryMenu";

export { WIPE } from "./themeWipe";

/** The close button's look. */
const ICON_BUTTON =
  "flex items-center justify-center rounded-[6px] border border-black/8 text-[#444444] transition-all active:scale-95 cursor-pointer dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** The hidden battery panel's Back: the previous screen (the close button goes to the level list). */
  onPrevious?: () => void;
  /** Question screens show the step progress (reference screens 8-14); the
   * connector screens between them (foxy intro, ready-check, notification
   * permission) don't — there's nothing to show progress *of* there. */
  progress?: { step: number; total: number };
  /** The screen the battery charges for, when that is not the bar's `step` (a
   * question asked again is a screen already paid for). */
  batteryStep?: number;
  /** The latest checked answer — plays the bar's correct / wrong reaction. */
  answer?: AnswerResult | null;
  /** Shows "step/total" above the bar. */
  showCount?: boolean;
  /** Unused now: sound lives in the hidden dev panels. */
  muted?: boolean;
  onToggleMuted?: () => void;
  /** The Level 1 header: no sound button, the light / dark switch moves up
   * beside the full screen icon, and the battery sits right of the bar. */
  level?: boolean;
}

// The step the progress bar last showed. Each screen mounts a fresh header,
// so this is what lets the fill start from where it was — growing when the
// user moves forward, shrinking back when they return to an earlier question.
let lastShown: { step: number; total: number } | null = null;

/** The count's colour by what is left: green when full, yellow halfway, red
 * when nearly empty — blended between them so it shifts a little at a time. */
const COUNT_FULL = [0x1e, 0xa0, 0x1b] as const;
const COUNT_HALF = [0xea, 0xb9, 0x11] as const;
const COUNT_LOW = [0xfc, 0x47, 0x1c] as const;

const countColor = (level: number) => {
  const t = Math.max(0, Math.min(100, level)) / 50;
  const [from, to, mix] = t >= 1 ? [COUNT_HALF, COUNT_FULL, t - 1] : [COUNT_LOW, COUNT_HALF, t];
  return `rgb(${from.map((channel, i) => Math.round(channel + (to[i] - channel) * mix)).join(" ")})`;
};

/** What is left of the battery, "14" — or the infinity sign when unlimited.
 * Fixed width, so the battery beside it stays put as the text changes. */
function BatteryCount() {
  const battery = useBattery();
  return (
    <span
      style={{ color: countColor(battery.unlimited ? 100 : battery.level) }}
      className={`min-w-[26px] font-semibold tabular-nums transition-colors duration-500 ${battery.unlimited ? "text-[28px] leading-[28px]" : "text-[20px] leading-[24px]"}`}
    >
      {batteryCount(battery)}
    </span>
  );
}

export function OnboardingHeader({ onBack, onPrevious, progress, batteryStep, answer, showCount, level }: OnboardingHeaderProps) {
  const [fromStep] = useState(() => (progress ? (lastShown?.step ?? progress.step - 1) : null));
  useEffect(() => {
    if (progress) lastShown = { step: progress.step, total: progress.total };
  }, [progress]);
  const fill = progress ? (progress.step / progress.total) * 100 : 0;
  const fillFrom = progress ? ((fromStep ?? progress.step - 1) / progress.total) * 100 : 0;
  return (
    // Fixed 83px box, placed from the top edge: page count at 27px, bar at
    // 63px. The onboarding's bar runs the full width between the 16px margins;
    // Level 1's runs between its close and the battery — one width on every screen.
    <header className={`relative shrink-0 select-none ${level ? "h-11" : "h-[83px]"}`}>
      {progress && showCount && (
        <span className="absolute top-[27px] left-1/2 -translate-x-1/2 text-[14px] leading-none font-medium whitespace-nowrap text-[#888888] tabular-nums dark:text-white/60">
          <span className="text-[#00B8A9]">{String(progress.step).padStart(2, "0")}</span>/
          {String(progress.total).padStart(2, "0")}
        </span>
      )}

      {/* Rive draws the bar; it animates to the new fill itself. */}
      {progress && !level && (
        <PersistentProgressBar
          value={fill}
          from={fillFrom}
          answer={answer}
          className="absolute top-[63px] left-4 right-4 mx-auto max-w-[480px] -translate-y-1/2"
        />
      )}

      {/* Level 1's header is the Figma row: 30px tall, 16px in from the edges,
          17px between close, bar and battery, all sitting on its bottom edge.
          The close is 30 x 30; the bar takes what is left (250px on a 390px
          frame when there is no count; the artboard's own proportions set its
          height); the battery is `battery.riv` 40px wide (its artboard is
          268 x 150, so 22px high) with what is left of it written beside it.
          The bar is centred in a 20.84px box, the height of Figma's group, and
          the battery in a 25px one. */}
      {level && (
        <div className="absolute inset-x-4 top-[6px] flex h-[30px] items-end gap-[17px]">
          {/* Only Level 1 has a button here (its close). The onboarding's Back
              lives in the hidden dev panel (see DevPanel). */}
          <button
            type="button"
            onClick={onBack}
            className={`h-[30px] w-[30px] shrink-0 border-0! dark:hover:bg-transparent! ${ICON_BUTTON}`}
            aria-label="Close"
          >
            {/* The cross is 19.3px across with a 3px stroke, in the 30 x 30 box. */}
            <svg
              aria-hidden
              viewBox="0 0 30 30"
              className="h-[30px] w-[30px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
            >
              <path d="M6.85 6.85 23.15 23.15M23.15 6.85 6.85 23.15" />
            </svg>
          </button>

          <div className="flex h-[20.84px] min-w-0 flex-1 items-center justify-center">
            {progress && (
              <PersistentProgressBar value={fill} from={fillFrom} answer={answer} className="w-full max-w-[480px]" />
            )}
          </div>

          {/* Each screen's `step` spends its share of the battery. Also the way
              into the hidden dev panel (see BatteryMenu). */}
          <BatteryMenu className="relative shrink-0" buttonClassName="block" onBack={onPrevious ?? onBack}>
            <span className="flex h-[25px] items-center gap-1">
              <PersistentBattery step={batteryStep ?? progress?.step} className="w-[40px]" />
              <BatteryCount />
            </span>
          </BatteryMenu>
        </div>
      )}

    </header>
  );
}
