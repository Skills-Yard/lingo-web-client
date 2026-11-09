"use client";

import { ActionRow } from "@/components/level-one/ActionRow";
import type { AnswerResult } from "../types";

export type LessonFooterProps = {
  /** The main button's words ("Continue", "Check", "Try again"). */
  label?: string;
  onContinue?: () => void;
  /** Greys the main button out until the learner has answered. */
  disabled?: boolean;
  /** Takes no taps but looks pressable. */
  locked?: boolean;
  /** White instead of green. */
  light?: boolean;
  /** The hint button beside the main one; `visible` slides it in and out. */
  hint?: { visible: boolean; onUse: () => void };
  answer?: AnswerResult | null;
};

/**
 * The bottom row of a lesson screen: the main button, with the hint button beside it when
 * there is one. The row keeps its height with or without the hint, so nothing above it moves.
 * It sizes itself from the screen frame (`ScreenFrame`); on its own it is 390 px wide.
 */
export function LessonFooter({ label = "Continue", onContinue, disabled, locked, light, hint, answer }: LessonFooterProps) {
  return <ActionRow maxWidth={450} hint={hint} answer={answer} ctaLabel={label} ctaDisabled={disabled} ctaLocked={locked} ctaLight={light} onContinue={onContinue} />;
}
