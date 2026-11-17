import { useCallback, useEffect, useRef } from "react";
import { addBatteryUnits } from "@/components/home/batteryStore";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { BATTERY_UNITS, noteRightAnswer, noteWrongAnswer, type StreakBeat } from "@/lib/moduleStreak";
import { chargeBattery } from "@/lib/rive/batteryHost";
import { electrifyModuleButton } from "@/lib/rive/moduleButtonHost";
import { fireProgressTrigger, startStrikeLoop, stopStrikeLoop } from "@/lib/rive/progressBarHost";
import { PROGRESS_BAR } from "@/lib/rive/runtime";

type StreakStrikesOptions = {
  /** The latest checked answer. */
  answer?: AnswerResult | null;
  /** The screen has a hint button, so its strikes are the `Check` ones. */
  withHint: boolean;
};

/**
 * Keeps the module's run (see `moduleStreak`) and plays what it earns on the
 * progress bar and the battery. Only a checked answer moves it: opening a
 * screen plays nothing, and what it played belongs to its screen. The module
 * button stays clickable while it plays, so the learner can skip it by moving
 * on; the returned function ends it early (the shell calls it on Continue).
 */
export const useStreakStrikes = ({ answer, withHint }: StreakStrikesOptions) => {
  // Read by the effect below without re-running it when only the hint changes.
  const withHintRef = useRef(withHint);
  useEffect(() => {
    withHintRef.current = withHint;
  }, [withHint]);

  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Cancels a beat still waiting to play and switches the loop off. */
  const endStrikes = useCallback(() => {
    clearTimeout(pending.current);
    stopStrikeLoop();
  }, []);

  /** A strike, a loop and a battery charge each come with the button's electric effect. */
  const playBeat = useCallback(({ trigger, loopSeconds, battery }: StreakBeat) => {
    if (battery) addBatteryUnits(BATTERY_UNITS);
    if (!trigger && !loopSeconds && !battery) return;
    pending.current = setTimeout(() => {
      if (trigger) fireProgressTrigger(trigger);
      if (loopSeconds) startStrikeLoop(loopSeconds);
      if (battery) chargeBattery();
      electrifyModuleButton();
    }, PROGRESS_BAR.strikeDelayMs);
  }, []);

  const answerId = answer?.id;
  const answerCorrect = answer?.correct;
  const answerPartial = answer?.partial;
  useEffect(() => {
    if (answerId === undefined) return;
    if (!answerCorrect) {
      endStrikes();
      noteWrongAnswer();
    } else if (!answerPartial) {
      playBeat(noteRightAnswer(withHintRef.current));
    }
  }, [answerId, answerCorrect, answerPartial, endStrikes, playBeat]);

  // Leaving the screen ends them too, so the next one never opens on a loop or a late strike.
  useEffect(() => endStrikes, [endStrikes]);

  return endStrikes;
};
