"use client";

import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { OperatorsScreen } from "./OperatorsScreen";
import { RecapScreen } from "./RecapScreen";
import { OPERATORS_LEVEL, STEP } from "./operators";
import { operatorsAccuracy } from "./operatorsScore";
import { SCREENS } from "./operatorsScreens";

/** The Operators module's screen for `?step=`: the screens that are a headline and stages, the closing screen, and "Lesson complete!". */
export function OperatorsRoute({ step }: { step: string }) {
  if (step === "complete") return <LessonCompleteScreen level={OPERATORS_LEVEL} accuracy={operatorsAccuracy} />;
  const number = Number(step);
  if (number === STEP.decision) return <RecapScreen />;
  const screen = SCREENS[number];
  return screen ? <OperatorsScreen key={number} screen={screen} /> : null;
}
