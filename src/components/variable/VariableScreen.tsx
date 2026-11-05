"use client";

import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { PlanAppScreen } from "./PlanAppScreen";
import { RecapScreen } from "./RecapScreen";
import { VariableQuizScreen } from "./VariableQuizScreen";
import { STEP, VARIABLE_LEVEL } from "./variable";
import { SCREENS } from "./variableScreens";
import { variableAccuracy } from "./variableScore";

/** The Variable module's screen for `?step=`: the screens that are a title and stages, the two with a layout of their own, and "Lesson complete!". */
export function VariableScreen({ step }: { step: string }) {
  if (step === "complete") return <LessonCompleteScreen level={VARIABLE_LEVEL} accuracy={variableAccuracy} />;
  const number = Number(step);
  if (number === STEP.plan) return <PlanAppScreen />;
  if (number === STEP.recap) return <RecapScreen />;
  const screen = SCREENS[number];
  return screen ? <VariableQuizScreen key={number} screen={screen} /> : null;
}
