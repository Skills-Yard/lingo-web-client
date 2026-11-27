"use client";

import { useRouter } from "next/navigation";
import { CharacterIntro } from "@/components/sequence/Intro3DScreen";
import { datatypesNext, datatypesPrevious, DATATYPES_STEPS, STEP } from "./datatypes";

/**
 * The module's first screen, "Let's Learn Data types" (`?step=0`, before the PDF's screens 1-30, so their numbers, the progress bar's total
 * and the battery's count stay as they were): the chosen character stands in front of the pale circle, as on the Variable and Command title
 * screens, and Continue goes on. No tag on it: the design's picture has none.
 */
export function DataTypesIntroScreen() {
  const router = useRouter();
  return (
    <CharacterIntro
      step={STEP.intro}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(STEP.intro))}
      onContinue={() => router.push(datatypesNext(STEP.intro))}
      word="Data types"
    />
  );
}
