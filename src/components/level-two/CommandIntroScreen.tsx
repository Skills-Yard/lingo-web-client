"use client";

import { useRouter } from "next/navigation";
import { CharacterIntro } from "@/components/sequence/Intro3DScreen";
import { MODULE_STEPS } from "@/lib/moduleFlow";
import { levelTwoHref } from "./levelTwo";

/**
 * `/module/commands?step=0` — "Let's Learn Commands": the module's title screen, in front of the pale circle the chosen 3D character
 * stands in. The design's tilted terminal tag is not on it (it sat over the character's hair; taken out on request, as the Sequence
 * intro's code window was). It is step 0 on purpose (as the Variable module's): the screens after it keep their numbers, the progress
 * bar starts empty and the battery still spends from screen 1.
 */
export function CommandIntroScreen() {
  const router = useRouter();
  return (
    <CharacterIntro
      step={0}
      total={MODULE_STEPS}
      onBack={() => router.push("/level")}
      onContinue={() => router.push(levelTwoHref(1))}
      word="Commands"
    />
  );
}
