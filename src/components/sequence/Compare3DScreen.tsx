"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { FLAT_CARDS, PictureCards } from "./PictureCards";
import type { SequenceQuiz } from "./sequence";
import { SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

/*
 * "Compare both attempts" (place 8 of the 3D flow, Figma `sequence_8`): the title, the two
 * attempts as cards, and the answers hanging right under them, then the hint and the main
 * button. There is no Hex line and no character here (no bubble, no face): the voice is all there
 * is. Everything is placed from the top by the design's numbers, so on a taller screen the spare
 * room is above the button, not between the cards and the answers.
 */

/** Where the two cards start (Figma `top`), and the gap kept under them before the answers. */
const PICTURES_TOP = 175;
const ANSWERS_GAP = 18;
/** Once the answer is checked the result panel comes up: the cards pull in (from their top) and the answers rise to stay clear of it. */
const CHECKED_PICTURES = { y: -12, scale: 0.8 } as const;
const CHECKED_ANSWERS_RISE = 55;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/**
 * The question, the 3D way: `quiz` is `COMPARE_3D`. The main button checks the pick and the result
 * panel slides up; a right answer moves on, a wrong one is tried again on the spot. `position` is
 * its place in the 3D flow (`sequence3d.ts`).
 */
export function Compare3DScreen({ quiz, position }: { quiz: SequenceQuiz; position: number }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  const correct = selectedId === quiz.correctId;

  const check = () => {
    setChecked(true);
    noteFirstTry(quiz.step, correct);
    if (!correct) noteStruggle(quiz.step, "miss");
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequence3dNext(position));
    else tryAgain();
  };

  const useHint = () => {
    setHinted(true);
    noteStruggle(quiz.step, "hint");
  };

  // After a wrong answer the right card isn't revealed: the learner gets to try again.
  const shownCorrectId = checked && !correct ? "" : quiz.correctId;
  const wrongNote = !correct && selectedId ? quiz.wrongBy?.[selectedId] : undefined;
  const withHint = !quiz.noHint;

  return (
    <LevelTwoShell
      step={position}
      total={SEQUENCE_3D_STEPS}
      voiceover={checked ? quiz.resultVoiceover : quiz.voiceover}
      onBack={() => router.push(sequence3dPrevious(position))}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Continue") : correct ? "Next" : "Try again"}
      hint={withHint ? { visible: !checked, onUse: useHint } : undefined}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? quiz.rightTitle : (wrongNote?.title ?? quiz.wrongTitle)}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct ? quiz.right : (wrongNote?.text ?? quiz.wrong)}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        <TitleText lines={quiz.title} />
      </ScreenTitle>
      {quiz.pictures && (
        <motion.div
          initial={false}
          animate={checked ? CHECKED_PICTURES : { y: 0, scale: 1 }}
          transition={PANEL_SPRING}
          className="absolute inset-x-0 flex justify-center"
          style={{ top: stageTop(PICTURES_TOP), transformOrigin: "50% 0" }}
        >
          <PictureCards cards={quiz.pictures} height={FLAT_CARDS.height} flat />
        </motion.div>
      )}
      <AnswerCards
        choices={quiz.choices}
        correctId={shownCorrectId}
        selectedId={selectedId}
        checked={checked}
        fadeOut={false}
        hinted={hinted}
        withHint={withHint}
        top={stageTop(PICTURES_TOP + FLAT_CARDS.height + ANSWERS_GAP)}
        rise={CHECKED_ANSWERS_RISE}
        // The design's rows: 358 x 76, a 52 picture then the words (15 px) with no empty spot after them. They are buttons, so they keep the app's 3D edge (the two cards above are only pictures: flat).
        width={358}
        tight={{ height: 76, padX: 15, radius: 18, iconSize: 52 }}
        iconGap={12}
        endGap={0}
        fontSize={15}
        onPick={setSelectedId}
      />
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
