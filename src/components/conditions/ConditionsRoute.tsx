"use client";

import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { ConditionsScreen } from "./ConditionsScreen";
import { NextScreen } from "./NextScreen";
import { CONDITIONS_LEVEL, STEP } from "./conditions";
import { conditionsAccuracy } from "./conditionsScore";
import { SCREENS } from "./conditionsScreens";

/** The Conditions module's screen for `?step=`: the screens that are a headline and stages, "What comes next?", and "Lesson complete!". */
export function ConditionsRoute({ step }: { step: string }) {
  if (step === "complete") return <LessonCompleteScreen level={CONDITIONS_LEVEL} accuracy={conditionsAccuracy} />;
  const number = Number(step);
  if (number === STEP.next) return <NextScreen />;
  const screen = SCREENS[number];
  return screen ? <ConditionsScreen key={number} screen={screen} /> : null;
}
