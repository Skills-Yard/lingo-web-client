"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  return (
    // Fixed 83px box, placed from the top edge: page count at 27px, bar at
    // 63px. The onboarding's bar runs the full width between the 16px margins;
    // Level 1's runs between its close and the battery — one width on every screen.
    <header className={`relative shrink-0 select-none ${level ? "h-11" : "h-[83px]"}`}>
      {/* Only Level 1 has a button here (its close). The onboarding's Back
          lives in the hidden dev panel (see DevPanel). */}
      {level && (
        <button
          type="button"
          onClick={onBack}
          className={`absolute left-4 top-[6px] border-transparent! dark:border-transparent! dark:hover:bg-transparent! ${ICON_BUTTON}`}
          aria-label="Close"
        >
          <X className="w-[30px] h-[30px]" strokeWidth={1.6} />
        </button>
      )}

      {progress && (
        <>
          {showCount && (
            <span className="absolute top-[27px] left-1/2 -translate-x-1/2 text-[14px] leading-none font-medium whitespace-nowrap text-[#888888] tabular-nums dark:text-white/60">
              <span className="text-[#00B8A9]">{String(progress.step).padStart(2, "0")}</span>/
              {String(progress.total).padStart(2, "0")}
            </span>
          )}
          {/* Rive draws the bar; it animates to the new fill itself. On the
              Level 1 header it ends 10px short of the battery and its count
              (90px wide, 16px from the edge). */}
          <PersistentProgressBar
            value={(progress.step / progress.total) * 100}
            from={(((fromStep ?? progress.step - 1)) / progress.total) * 100}
            answer={answer}
            className={`absolute mx-auto max-w-[480px] -translate-y-1/2 ${level ? "top-[25.5px] left-[67px] right-[116px] sm:left-[116px]" : "top-[63px] left-4 right-4"}`}
          />
        </>
      )}

      {/* The battery sits in the top-right corner: `battery.riv` 60px wide (its
          artboard is 320 x 110), with what is left of it written beside it. Each screen's `step` spends its
          share of it. Also the way into the hidden dev panel (see BatteryMenu). */}
      {level && (
        <BatteryMenu className="absolute top-[6px] right-4" onBack={onPrevious ?? onBack}>
          <span className="flex h-[39px] items-center gap-1 rounded-md">
            <PersistentBattery step={batteryStep ?? progress?.step} className="w-[60px]" />
            <BatteryCount />
          </span>
        </BatteryMenu>
      )}

    </header>
  );
}
