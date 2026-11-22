"use client";

import { useRouter } from "next/navigation";
import { CharacterIntro } from "@/components/sequence/Intro3DScreen";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";

/** The code tag's place and tilt (stage px, in the 390px column), from the design's picture: at the upper right, over the character's hair. */
const TAG = { left: 240, top: 204, width: 142, tilt: -8 };

/** The design's tilted code window, "age = 20": a dark bar with the three window dots over a blue body, the value in green. */
const AgeTag = () => (
  <div aria-hidden className="pointer-events-none absolute" style={{ left: TAG.left, top: TAG.top, width: TAG.width, transform: `rotate(${TAG.tilt}deg)` }}>
    <div className="overflow-hidden rounded-[10px] shadow-[0_8px_16px_rgba(46,85,230,0.35)] ring-1 ring-white/40">
      <div className="flex h-[15px] items-center gap-[5px] bg-[#2447C9] px-[8px]">
        <span className="size-[6px] rounded-full bg-[#FF5F57]" />
        <span className="size-[6px] rounded-full bg-[#FEBC2E]" />
        <span className="size-[6px] rounded-full bg-[#28C840]" />
      </div>
      <div className="flex h-[40px] items-center justify-center bg-[linear-gradient(180deg,#4C93FB_0%,#2F6AF0_100%)] text-[23px] leading-none font-bold whitespace-nowrap text-white">
        age =&nbsp;<span className="text-[#B9F34A]">20</span>
      </div>
    </div>
  </div>
);

/**
 * The module's first screen, "Let's Learn Variables" (`?step=0`, before the PDF's screens 1-34, so their numbers and the battery's
 * count stay as they were): the chosen character stands in front of the pale circle with the tilted "age = 20" tag, and Continue goes on.
 */
export function VariableIntroScreen() {
  const router = useRouter();
  return (
    <CharacterIntro
      step={STEP.intro}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.intro))}
      onContinue={() => router.push(variableNext(STEP.intro))}
      word="Variables"
    >
      <AgeTag />
    </CharacterIntro>
  );
}
