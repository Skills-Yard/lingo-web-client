"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { batteryCount, useBattery } from "@/components/home/batteryStore";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
import { BatteryMenu } from "./BatteryMenu";

export { WIPE } from "./themeWipe";

/** Back, full screen, light/dark and sound share one look — same size, same weight. */
const ICON_BUTTON =
  "w-[39px] h-[39px] flex items-center justify-center rounded-md border border-black/8 text-[#444444] transition-all active:scale-95 cursor-pointer dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** Question screens show the step progress (reference screens 8-14); the
   * connector screens between them (foxy intro, ready-check, notification
   * permission) don't — there's nothing to show progress *of* there. */
  progress?: { step: number; total: number };
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

/** What is left of the battery, "14" — or the infinity sign when unlimited.
 * Fixed width, so the battery beside it stays put as the text changes. */
function BatteryCount() {
  const battery = useBattery();
  return (
    <span
      className={`min-w-[26px] font-semibold text-[#01A17F] tabular-nums ${battery.unlimited ? "text-[28px] leading-[28px]" : "text-[20px] leading-[24px]"}`}
    >
      {batteryCount(battery)}
    </span>
  );
}

export function OnboardingHeader({ onBack, progress, answer, showCount, level }: OnboardingHeaderProps) {
  const [fromStep] = useState(() => (progress ? (lastShown?.step ?? progress.step - 1) : null));
  useEffect(() => {
    if (progress) lastShown = { step: progress.step, total: progress.total };
  }, [progress]);
  return (
    // Fixed 83px box, placed from the top edge: page count at 27px, bar at
    // 63px, and the 39px buttons centred on the bar (43.5px). The bar always
    // runs between back and the two right buttons — one width on every screen.
    <header className="relative h-[83px] shrink-0 select-none">
      <button
        type="button"
        onClick={onBack}
        className={`absolute left-4 ${level ? "top-[6px] border-transparent! dark:border-transparent! dark:hover:bg-transparent!" : `top-[43.5px]`} ${ICON_BUTTON}`}
        aria-label={level ? "Close" : "Back"}
      >
        {level ? <X className="w-[30px] h-[30px]" strokeWidth={1.6} /> : <ChevronLeft className="w-5 h-5" strokeWidth={1.4} />}
      </button>

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
            className={`absolute left-[67px] mx-auto max-w-[480px] -translate-y-1/2 ${level ? "top-[25.5px] right-[116px]" : "top-[63px] right-4"}`}
          />
        </>
      )}

      {/* The battery sits in the top-right corner: `battery.riv` 60px wide (its
          artboard is 320 x 110), with what is left of it written beside it. Each screen's `step` spends its
          share of it. Also the way into the hidden dev panel (see BatteryMenu). */}
      {level && (
        <BatteryMenu className="absolute top-[6px] right-4">
          <span className="flex h-[39px] items-center gap-1 rounded-md">
            <PersistentBattery step={progress?.step} className="w-[60px]" />
            <BatteryCount />
          </span>
        </BatteryMenu>
      )}

    </header>
  );
}
