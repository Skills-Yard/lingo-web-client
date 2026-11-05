"use client";

import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { SEQUENCE_LEVEL } from "./sequence";
import { firstTryAccuracy } from "./sequenceScore";

/** "Lesson complete!" for the Sequence module, with its own score. */
export function SequenceCompleteScreen() {
  return <LessonCompleteScreen level={SEQUENCE_LEVEL} accuracy={firstTryAccuracy} />;
}
