"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { batteryCount, useBattery } from "@/components/home/batteryStore";
import { EDGE, RAISED_SMALL } from "@/components/ui/raised";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
import { useTheme } from "@/context/ThemeContext";
import { BatteryMenu, PanelButton } from "./BatteryMenu";
import { WIPE } from "./themeWipe";

export { WIPE };

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

/** The light / dark switch in the battery's hidden panel, wiping to this screen's own background. */
function ThemeOption() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <PanelButton onClick={() => toggleTheme(WIPE)}>
      {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
      {dark ? "Light mode" : "Dark mode"}
    </PanelButton>
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
    // Fixed box, placed from the top edge: page count at 27px, bar `--screen-top` down on
    // screen, running the full width between the 16px margins.
    <header className="relative h-[62px] shrink-0 select-none">
      {progress && showCount && (
        <span className="absolute top-[27px] left-1/2 -translate-x-1/2 text-[14px] leading-none font-medium whitespace-nowrap text-[#888888] tabular-nums dark:text-white/60">
          <span className="text-[#00B8A9]">{String(progress.step).padStart(2, "0")}</span>/
          {String(progress.total).padStart(2, "0")}
        </span>
      )}

      {/* Rive draws the bar; it animates to the new fill itself. */}
      {progress && (
        <PersistentProgressBar
          value={fill}
          from={fillFrom}
          answer={answer}
          className="absolute top-[calc(var(--screen-top)/var(--stage-scale,1))] left-4 right-4 mx-auto max-w-[480px]"
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
        <div className="absolute inset-x-4 -top-[5.35px] flex h-[30px] items-end gap-[17px]">
          {/* Only Level 1 has a button here (its close). The onboarding's Back
              lives in the hidden dev panel (see DevPanel). */}
          <button
            type="button"
            onClick={onBack}
            className={`h-[30px] w-[30px] shrink-0 ${ICON_BUTTON}`}
            aria-label="Close"
          >
            {/* The cross is 19.3px across with a 3px stroke, in the 30 x 30 box: the row sits 5.35px up, so the cross itself meets the page margin. */}
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
          <BatteryMenu
            className="relative shrink-0"
            buttonClassName={BATTERY_BUTTON}
            onBack={onPrevious ?? onBack}
            extraOptions={() => <ThemeOption />}
          >
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
