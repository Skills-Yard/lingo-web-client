"use client";

import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { MoveHexScreen } from "@/components/level-one/MoveHexScreen";
import { useCallback } from "react";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { SEQUENCE_STEPS, sequenceNext, sequencePrevious } from "./sequence";
import { claimReward, noteFirstTry } from "./sequenceScore";

const STEP = 7;
/** The battery this screen pays when Hex gets there (once per run of the module). */
const REWARD = { id: "sequence-guide-hex", claim: claimReward };

/** What Hex is about to do, on the first look at the board. */
function GuideTip() {
  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-[#F1EEFF] px-3.5 py-3 dark:bg-[#23204A]">
      <Lightbulb aria-hidden className="size-6 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
      <p className="text-[14px] leading-5 font-medium text-[#444444] dark:text-white">
        Hex is very intelligent and it follows the <b className="font-semibold text-[#6D4FE0] dark:text-[#A79BFF]">exact command</b> which you will give.
      </p>
    </div>
  );
}

/** "Let's guide Hex": the first lesson's game, opened with a tip, ending on a result panel. */
export function GuideHexScreen() {
  const router = useRouter();
  const onAnswer = useCallback((correct: boolean) => noteFirstTry(STEP, correct), []);
  return (
    <MoveHexScreen
      flow={{
        step: STEP,
        total: SEQUENCE_STEPS,
        voiceover: SEQUENCE_AUDIO.guideHex,
        onBack: () => router.push(sequencePrevious(STEP)),
        tip: <GuideTip />,
        rightTitle: "Great!",
        right: "You got the energy.",
        wrongTitle: "Oops!",
        wrong: "You missed the energy.",
        onAnswer,
        reward: REWARD,
        onDone: () => router.push(sequenceNext(STEP)),
      }}
    />
  );
}
