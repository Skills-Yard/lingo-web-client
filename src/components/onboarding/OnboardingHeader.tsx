"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentBattery } from "@/components/ui/PersistentBattery";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
import { BatteryMenu } from "./BatteryMenu";

export { WIPE } from "./themeWipe";

/** Back, full screen, light/dark and sound share one look — same size, same weight. */
const ICON_BUTTON =
  "flex items-center justify-center rounded-[6px] border border-black/8 text-[#444444] transition-all active:scale-95 cursor-pointer dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

/** Level 1's slimmer bar: 30px buttons in a 44px header. */
const BUTTON_SIZE = "w-[39px] h-[39px]";
const LEVEL_BUTTON_SIZE = "w-[30px] h-[30px]";

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

export function OnboardingHeader({ onBack, progress, answer, showCount, level }: OnboardingHeaderProps) {
  const [fromStep] = useState(() => (progress ? (lastShown?.step ?? progress.step - 1) : null));
  useEffect(() => {
    if (progress) lastShown = { step: progress.step, total: progress.total };
  }, [progress]);
  return (
    // Fixed 83px box, placed from the top edge: page count at 27px, bar at
    // 63px, and the 39px buttons centred on the bar (43.5px). The bar always
    // runs between back and the two right buttons — one width on every screen.
    <header className={`relative shrink-0 select-none ${level ? "h-11" : "h-[83px]"}`}>
      <button
        type="button"
        onClick={onBack}
        className={`absolute left-4 ${level ? `top-[3px] ${LEVEL_BUTTON_SIZE}` : `top-[43.5px] ${BUTTON_SIZE}`} ${ICON_BUTTON}`}
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.4} />
      </button>

      {progress && (
        <>
          {showCount && (
            <span className="absolute top-[27px] left-1/2 -translate-x-1/2 text-[14px] leading-none font-medium whitespace-nowrap text-[#888888] tabular-nums dark:text-white/60">
              <span className="text-[#00B8A9]">{String(progress.step).padStart(2, "0")}</span>/
              {String(progress.total).padStart(2, "0")}
            </span>
          )}
          {/* Rive draws the bar; it animates to the new fill itself. It ends
              12px short of the right-hand button — the 56px battery box on
              the Level 1 header. */}
          <PersistentProgressBar
            value={(progress.step / progress.total) * 100}
            from={(((fromStep ?? progress.step - 1)) / progress.total) * 100}
            answer={answer}
            className={`absolute mx-auto max-w-[480px] -translate-y-1/2 ${level ? "top-[18px] right-[78px] left-[58px]" : "top-[63px] right-4 left-[67px]"}`}
          />
        </>
      )}

      {/* The battery sits in the top-right corner: `battery.riv` at the old
          icon's 15px height, so 44px wide (its artboard is 320 x 110). Each
          screen's `step` spends its share of it. Also the way into the hidden
          dev panel (see BatteryMenu). */}
      {level && (
        <BatteryMenu className="absolute top-[3px] right-4">
          <span className="flex h-[30px] w-[48px] items-center justify-center rounded-[6px] border border-black/8 dark:border-white/15">
            <PersistentBattery step={progress?.step} className="w-[36px]" />
          </span>
        </BatteryMenu>
      )}

    </header>
  );
}
