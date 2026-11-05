"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue } from "@/components/level-two/RobotBackdrop";
import { SlotImage } from "@/components/level-two/SlotImage";
import { TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { PictureCards } from "./PictureCards";
import { SceneBackdrop } from "./SceneBackdrop";
import { SEQUENCE_STEPS, sequenceNext, sequencePrevious, type SequenceQuiz } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

/** A list of answers only has to clear the result panel; there is a picture to keep in view above it. */
const LIST_RISE = 150;
/** Where the pictures to compare start (Figma `top`), their height, and how far they rise as Hex leaves. */
const PICTURES_TOP = 248;
const PICTURES_HEIGHT = 200;
const PICTURES_RISE = 90;
/** A single picture also shrinks (from its top) as it rises, so the raised answers don't reach it. */
const CLOSE_UP_CHECKED_SCALE = 0.9;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/**
 * A Sequence question: the title, Hex asking it, and the answers. The main
 * button checks the pick and the result panel slides up. A right answer moves
 * on; a wrong one is tried again on the spot (unless the question is `noRetry`,
 * where every pick moves on), so unlike the first lesson's quizzes the right
 * card isn't shown and nothing goes to a review.
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
  const fixedRoom = "room" in quiz.scene && !!quiz.scene.room.fixed;
  const fadeCards = checked && (fixedRoom || (correct && !!quiz.choices.find((choice) => choice.id === selectedId)?.moves?.length));

  const check = () => {
    setChecked(true);
    noteFirstTry(quiz.step, correct);
    if (!correct) noteStruggle(quiz.step, "miss");
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
    else if (correct || quiz.noRetry) router.push(sequenceNext(quiz.step));
    else tryAgain();
  };

  const useHint = () => {
    setHinted(true);
    noteStruggle(quiz.step, "hint");
  };

  const title = checked && quiz.resultTitle ? quiz.resultTitle : quiz.title;
  const titleSize = quiz.titleSize ?? (quiz.smallTitle ? 26 : undefined);
  // After a wrong answer the right card isn't revealed: the learner gets to try again.
  const shownCorrectId = checked && !correct ? "" : quiz.correctId;
  const wrongNote = !correct && selectedId ? quiz.wrongBy?.[selectedId] : undefined;
  // The hint is Hex saying it, in place of his line.
  const line = hinted && quiz.hintText ? [{ text: quiz.hintText }] : quiz.line;
  const withHint = !quiz.noHint;

  return (
    <LevelTwoShell
      step={quiz.step}
      total={SEQUENCE_STEPS}
      voiceover={checked ? quiz.resultVoiceover : quiz.voiceover}
      onBack={() => router.push(sequencePrevious(quiz.step))}
      scene={
        "room" in quiz.scene ? (
          <SceneBackdrop dress={!checked ? quiz.scene.room.start : correct ? quiz.scene.room.right : quiz.scene.room.wrong} lifted={checked && !fixedRoom} />
        ) : "robot" in quiz.scene ? (
          <RobotBackdrop below={robotBelowDialogue(quiz.bubbleTop, quiz.bubble)} pose="idle" />
        ) : (
          <SoftBackdrop />
        )
      }
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Continue") : quiz.noRetry ? "Continue" : correct ? "Next" : "Try again"}
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
      <ScreenTitle key={quiz.resultTitle && checked ? "result" : "ask"} oneLine={!quiz.wrapTitle}>
        <span style={titleSize ? { fontSize: titleSize } : undefined}>
          <TitleText lines={title} />
        </span>
      </ScreenTitle>
      <CentredRow top={stageTop(quiz.bubbleTop)}>
        <HexBubble key={attempt} entryKey={`sequence-${quiz.step}-${attempt}`} hex="left" line={line} size={quiz.bubble} leaving={checked} />
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
      {quiz.closeUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: checked ? CLOSE_UP_CHECKED_SCALE : 1, y: checked ? -PICTURES_RISE : 0 }}
          transition={{ ...PANEL_SPRING, opacity: { duration: 0.3, delay: 0.2 } }}
          className="absolute inset-x-0 flex justify-center"
          style={{ top: stageTop(quiz.closeUp.top), transformOrigin: "50% 0" }}
        >
          <div
            className="rounded-[16px] border-4 border-white bg-[#F6F4FE] p-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-[#818185] dark:bg-[#0F1F26]"
            style={{ width: quiz.closeUp.width }}
          >
            <SlotImage file={quiz.closeUp.src} className="h-auto w-full" />
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {quiz.wrongPicture && checked && !correct && (
          <motion.div
            key="wrong-picture"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute inset-x-0 flex justify-center"
            style={{ top: stageTop(quiz.wrongPicture.top) }}
          >
            <div
              className="rounded-[16px] border-4 border-white bg-white p-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-[#818185] dark:bg-[#15181E]"
              style={{ width: quiz.wrongPicture.width }}
            >
              <SlotImage file={quiz.wrongPicture.src} className="h-auto w-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {quiz.layout === "list" ? (
        <AnswerCards
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          hinted={hinted}
          withHint={withHint}
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
          withHint={withHint}
          pictureWidth={quiz.pictureWidth}
          pictureHeight={quiz.pictureHeight}
          cardHeight={quiz.cardHeight}
          onPick={setSelectedId}
        />
      )}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
