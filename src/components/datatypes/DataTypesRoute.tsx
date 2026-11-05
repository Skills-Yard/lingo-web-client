"use client";

import { LessonCompleteScreen } from "@/components/level-one/LessonCompleteScreen";
import { DataTypesScreen } from "./DataTypesScreen";
import { RecapScreen } from "./RecapScreen";
import { DATATYPES_LEVEL, STEP } from "./datatypes";
import { datatypesAccuracy } from "./datatypesScore";
import { SCREENS } from "./datatypesScreens";

/** The Data Types module's screen for `?step=`: the screens that are a headline and stages, the recap, and "Lesson complete!". */
export function DataTypesRoute({ step }: { step: string }) {
  if (step === "complete") return <LessonCompleteScreen level={DATATYPES_LEVEL} accuracy={datatypesAccuracy} />;
  const number = Number(step);
  if (number === STEP.recap) return <RecapScreen />;
  const screen = SCREENS[number];
  return screen ? <DataTypesScreen key={number} screen={screen} /> : null;
}
