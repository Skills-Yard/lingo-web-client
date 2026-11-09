"use client";

import type { Rive } from "@rive-app/canvas";
import { LESSON_COMPLETE } from "@/lib/rive/runtime";
import { vibrateForLessonComplete } from "@/lib/haptics";
import { Artboard } from "../artboard/Artboard";
import { ARTBOARDS } from "../artboard/presets";

export type LessonCompleteProps = {
  xp: number;
  /** The share (0-100) of questions answered right the first time. */
  accuracy: number;
  /** How long the lesson took, in seconds. */
  seconds: number;
  className?: string;
};

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * The "Lesson complete!" results, drawn by their artboard: once it is ready the XP, accuracy and
 * time are written into it and it plays. Give it the whole screen's width (`className="h-full w-full"`).
 */
export function LessonComplete({ xp, accuracy, seconds, className = "h-full w-full" }: LessonCompleteProps) {
  const start = (rive: Rive) => {
    const instance = rive.viewModelInstance;
    if (!instance) return;
    // Each value is a number, or display text ("+40", "92%", "3:42") if the artboard declares it as a string.
    const set = (name: string, value: number, text: string) => {
      const number = instance.number(name);
      if (number) number.value = value;
      else {
        const string = instance.string(name);
        if (string) string.value = text;
      }
    };
    set(LESSON_COMPLETE.xpProperty, xp, `+${xp}`);
    set(LESSON_COMPLETE.accuracyProperty, accuracy, `${accuracy}%`);
    set(LESSON_COMPLETE.timeProperty, seconds, formatTime(seconds));
    instance.trigger(LESSON_COMPLETE.playTrigger)?.trigger();
    vibrateForLessonComplete();
  };
  return <Artboard {...ARTBOARDS["lesson-complete"]} label="Lesson complete" onReady={start} className={className} />;
}
