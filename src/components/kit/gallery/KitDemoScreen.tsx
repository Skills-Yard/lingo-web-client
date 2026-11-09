"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { Celebration, ResultSheet, HexGuide, Answers, ScreenFrame, Spacer, LessonTitle, RESULT_LIFT, type AnswerResult, type OptionData } from "../internal";

const OPTIONS: OptionData[] = [
  { id: "asking", text: "Asking Question", image: "/images/level-one/asking-question.png", tint: "lavender" },
  { id: "giving", text: "Giving Instruction", image: "/images/level-one/giving-instruction.png", tint: "cream" },
];
const CORRECT = "giving";

/**
 * A whole lesson question screen made from kit components alone: the frame (header, main button, hint,
 * voiceover), a title, Hex with his line, the answers, and the result sheet. Nothing here is specific to
 * this screen but its words — which is what lets a screen be data.
 */
export function KitDemoScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const correct = selectedId === CORRECT;

  const onContinue = () => {
    if (!checked) {
      setChecked(true);
      setAnswer((now) => ({ id: (now?.id ?? 0) + 1, correct }));
    } else if (correct) {
      router.push("/kit");
    } else {
      setSelectedId(null);
      setChecked(false);
      setHinted(false);
      setAnswer(null);
    }
  };

  return (
    <ScreenFrame
      step={3}
      total={10}
      onBack={() => router.push("/kit")}
      voiceover={MODULE_AUDIO.teacherDoing}
      ctaLabel={!checked ? "Check" : correct ? "Continue" : "Try again"}
      ctaDisabled={!checked && selectedId === null}
      hint={{ visible: !checked, onUse: () => setHinted(true) }}
      answer={answer}
      onContinue={onContinue}
      lift={checked ? RESULT_LIFT : 0}
      overlay={
        <>
          <ResultSheet correct={correct} open={checked} title={correct ? "Exactly!" : undefined} text={correct ? "The teacher is giving an **instruction**." : "Remember: the teacher is giving an **instruction**."} />
          <Celebration active={checked && correct} />
        </>
      }
    >
      <LessonTitle text="What *teacher* is doing?" />
      <HexGuide text="Listen to what the teacher asks the class to do." />
      <Spacer />
      <Answers look="tiles" tiles="cards" options={OPTIONS} selectedId={selectedId} onSelect={setSelectedId} checked={checked} correctId={CORRECT} revealCorrect={correct} hintId={hinted ? CORRECT : null} stagger />
    </ScreenFrame>
  );
}
