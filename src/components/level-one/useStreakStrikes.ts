import { useCallback, useEffect, useRef } from "react";
import { addBatteryUnits } from "@/components/home/batteryStore";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { BATTERY_UNITS, noteRightAnswer, noteWrongAnswer, type StreakBeat } from "@/lib/moduleStreak";
import { chargeBattery } from "@/lib/rive/batteryHost";
import { electrifyModuleButton, holdModuleButton, releaseModuleButton } from "@/lib/rive/moduleButtonHost";
import { fireProgressTrigger, startStrikeLoop, stopStrikeLoop } from "@/lib/rive/progressBarHost";
import { BUTTON, PROGRESS_BAR } from "@/lib/rive/runtime";

type StreakStrikesOptions = {
  /** The latest checked answer. */
  answer?: AnswerResult | null;
  /** The screen has a hint button, so its strikes are the `Check` ones. */
  withHint: boolean;
};

/**
 * Keeps the module's run (see `moduleStreak`) and plays what it earns on the
 * progress bar and the battery. Only a checked answer moves it: opening a
 * screen plays nothing, and what it played belongs to its screen: the module
 * button takes no clicks until it is over (it is not drawn disabled), so the
 * learner moves on only after, and the returned function ends it early.
 */
export const useStreakStrikes = ({ answer, withHint }: StreakStrikesOptions) => {
  // Read by the effect below without re-running it when only the hint changes.
  const withHintRef = useRef(withHint);
  useEffect(() => {
    withHintRef.current = withHint;
  }, [withHint]);

  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Cancels a beat still waiting to play, switches the loop off and lets the button go. */
  const endStrikes = useCallback(() => {
    clearTimeout(pending.current);
    stopStrikeLoop();
    releaseModuleButton();
  }, []);

  /** A strike, a loop and a battery charge each come with the button's electric effect. */
  const playBeat = useCallback(({ trigger, loopSeconds, battery, playSeconds }: StreakBeat) => {
    if (battery) addBatteryUnits(BATTERY_UNITS);
    if (!trigger && !loopSeconds && !battery) return;
    // Held from the check, not from the (delayed) start, so there is no click to catch in between.
    holdModuleButton(PROGRESS_BAR.strikeDelayMs + Math.max(playSeconds, BUTTON.electricSeconds) * 1000);
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
