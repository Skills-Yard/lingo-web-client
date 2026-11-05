"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue } from "@/components/level-two/RobotBackdrop";
import { TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { PictureCards } from "./PictureCards";
import { SceneBackdrop } from "./SceneBackdrop";
import { SEQUENCE_STEPS, sequenceNext, sequencePrevious, type SequenceQuiz } from "./sequence";
import { noteFirstTry } from "./sequenceScore";

/** A list of answers only has to clear the result panel; there is a picture to keep in view above it. */
const LIST_RISE = 165;
/** Where the pictures to compare start (Figma `top`), their height, and how far they rise as Hex leaves. */
const PICTURES_TOP = 248;
const PICTURES_HEIGHT = 200;
const PICTURES_RISE = 90;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/**
 * A Sequence question: the title, Hex asking it, and the answers. The main
 * button checks the pick and the result panel slides up. A right answer moves
 * on; a wrong one is tried again on the spot, so unlike the first lesson's
 * quizzes the right card isn't shown and nothing goes to a review.
 */
export function SequenceQuizScreen({ quiz }: { quiz: SequenceQuiz }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  // Each try gets a fresh Hex: he left when the last one was checked.
  const [attempt, setAttempt] = useState(0);
  const correct = selectedId === quiz.correctId;
  // Like the first lesson: a right answer that plays a robot move clears the cards so it can be seen.
  const fadeCards = checked && correct && !!quiz.choices.find((choice) => choice.id === selectedId)?.moves?.length;

  const check = () => {
    setChecked(true);
    noteFirstTry(quiz.step, correct);
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    quiz.choices.find((choice) => choice.id === selectedId)?.moves?.forEach((move) => fireRobot(move));
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(quiz.step));
    else tryAgain();
  };

  const title = checked && quiz.resultTitle ? quiz.resultTitle : quiz.title;
  // After a wrong answer the right card isn't revealed: the learner gets to try again.
  const shownCorrectId = checked && !correct ? "" : quiz.correctId;

  return (
    <LevelTwoShell
      step={quiz.step}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(quiz.step))}
      scene={
        "image" in quiz.scene ? (
          <SceneBackdrop src={quiz.scene.image} lifted={checked} />
        ) : "robot" in quiz.scene ? (
          <RobotBackdrop below={robotBelowDialogue(quiz.bubbleTop, quiz.bubble)} pose="idle" />
        ) : (
          <SoftBackdrop />
        )
      }
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Continue") : correct ? "Next" : "Try again"}
      hint={{ visible: !checked, onUse: () => setHinted(true) }}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? quiz.rightTitle : quiz.wrongTitle}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct ? quiz.right : quiz.wrong}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle key={quiz.resultTitle && checked ? "result" : "ask"} oneLine>
        <span className={quiz.smallTitle ? "text-[26px]" : undefined}>
          <TitleText lines={title} />
        </span>
      </ScreenTitle>
      <CentredRow top={stageTop(quiz.bubbleTop)}>
        <HexBubble key={attempt} entryKey={`sequence-${quiz.step}-${attempt}`} hex="left" line={quiz.line} size={quiz.bubble} leaving={checked} />
      </CentredRow>
      {quiz.pictures && (
        <motion.div
          initial={false}
          animate={{ y: checked ? -PICTURES_RISE : 0 }}
          transition={PANEL_SPRING}
          className="absolute inset-x-0 flex justify-center"
          style={{ top: stageTop(PICTURES_TOP) }}
        >
          <PictureCards cards={quiz.pictures} height={PICTURES_HEIGHT} />
        </motion.div>
      )}
      {quiz.layout === "list" ? (
        <AnswerCards
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          hinted={hinted}
          withHint
          rise={LIST_RISE}
          onPick={setSelectedId}
        />
      ) : (
        <TileCards
          layout="pair"
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          hinted={hinted}
          withHint
          pictureWidth={quiz.pictureWidth}
          pictureHeight={quiz.pictureHeight}
          onPick={setSelectedId}
        />
      )}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
