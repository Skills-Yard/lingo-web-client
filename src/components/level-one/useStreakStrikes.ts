import { useEffect, useRef } from "react";
import { addBatteryUnits } from "@/components/home/batteryStore";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import {
  BATTERY_UNITS,
  noteRightAnswer,
  noteWrongAnswer,
  openScreen,
  type StreakBeat,
} from "@/lib/moduleStreak";
import { fireProgressTrigger } from "@/lib/rive/progressBarHost";
import { PROGRESS_BAR } from "@/lib/rive/runtime";

const playBeat = ({ trigger, battery }: StreakBeat) => {
  if (battery) addBatteryUnits(BATTERY_UNITS);
  if (trigger) setTimeout(() => fireProgressTrigger(trigger), PROGRESS_BAR.strikeDelayMs);
};

type StreakStrikesOptions = {
  step: number;
  /** The latest checked answer. */
  answer?: AnswerResult | null;
  /** The screen has a hint button, so its strikes are the `Check` ones. */
  withHint: boolean;
};

/**
 * Keeps the module's run (see `moduleStreak`) and plays what it earns on the
 * progress bar and the battery: a checked answer grows or breaks it, and so
 * does opening the screen after one that asked nothing.
 */
export const useStreakStrikes = ({ step, answer, withHint }: StreakStrikesOptions) => {
  // Read by the effects below without re-running them when only the hint changes.
  const withHintRef = useRef(withHint);
  useEffect(() => {
    withHintRef.current = withHint;
  }, [withHint]);

  useEffect(() => {
    const beat = openScreen(step, withHintRef.current);
    if (beat) playBeat(beat);
  }, [step]);

  const answerId = answer?.id;
  const answerCorrect = answer?.correct;
  useEffect(() => {
    if (answerId === undefined) return;
    if (answerCorrect) playBeat(noteRightAnswer(withHintRef.current));
    else noteWrongAnswer();
  }, [answerId, answerCorrect]);
};
