"use client";

import { useEffect, useState } from "react";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";
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

/**
 * The onboarding's header: just the progress bar, full width. (The lessons' header — close button, bar and
 * battery — is the kit's `LessonHeader`.)
 */
export function OnboardingHeader({ progress, answer, showCount }: OnboardingHeaderProps) {
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
    </header>
  );
}
