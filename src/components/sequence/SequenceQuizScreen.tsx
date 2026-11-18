"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAnswerHint } from "@/components/level-one/answerHint";
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
import type { RoomDress } from "./SequenceRoom";
import { SEQUENCE_STEPS, sequenceNext, sequencePrevious, type SequenceQuiz } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

/** A list of answers only has to clear the result panel; there is a picture to keep in view above it. */
const LIST_RISE = 150;
/** With nothing but Hex's line above it, the list rises further, well clear of the panel. */
const LIST_RISE_OPEN = 210;
/** Where the pictures to compare start (Figma `top`), their height, and how far they rise as Hex leaves. */
const PICTURES_TOP = 248;
const PICTURES_HEIGHT = 200;
const PICTURES_RISE = 90;
/** A single picture also shrinks (from its top) as it rises, so the raised answers don't reach it. */
const CLOSE_UP_CHECKED_SCALE = 0.9;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** How long the cards take to rise and fade after a right answer, before the boy moves. */
const CARDS_CLEAR_MS = 700;

type RoomScene = Extract<SequenceQuiz["scene"], { room: unknown }>["room"];

/** What the boy has on: the start until checked, then the right or wrong result (a cleared room's right result waits for the cards to go). */
const roomDress = (room: RoomScene, checked: boolean, correct: boolean, cardsGone: boolean): RoomDress => {
  if (!checked) return room.start;
  if (!correct) return room.wrong;
  return room.clearOnRight && !cardsGone ? room.start : room.right;
};

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
  // The hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  // Each try gets a fresh Hex: he left when the last one was checked.
  const [attempt, setAttempt] = useState(0);
  // A right answer in a `clearOnRight` room: the boy waits until the cards have gone, then moves.
  const [cardsGone, setCardsGone] = useState(false);
  const correct = selectedId === quiz.correctId;
  const room = "room" in quiz.scene ? quiz.scene.room : null;
  // The room stays put and the cards clear, so the boy is in view while he moves.
  const clearedRoom = !!room && (!!room.fixed || (!!room.clearOnRight && correct));
  // Like the first lesson: an answer that plays a robot move (the right one, or the robot's wrong try) clears the cards so the move can be seen, not played behind them.
  const fadeCards = checked && (clearedRoom || !!quiz.choices.find((choice) => choice.id === selectedId)?.moves?.length);

  useEffect(() => {
    if (!checked || !correct) return;
    const timer = window.setTimeout(() => setCardsGone(true), CARDS_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [checked, correct]);

  const check = () => {
    answerHint.stop();
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

  // The learner picks an answer: the hint's hand goes.
  const pick = (id: string) => {
    answerHint.stop();
    setSelectedId(id);
  };

  // The hint points at the right answer; it is not picked for the learner.
  const useHint = () => {
    answerHint.press(quiz.correctId);
    noteStruggle(quiz.step, "hint");
  };

  const title = checked && quiz.resultTitle ? quiz.resultTitle : quiz.title;
  const titleSize = quiz.titleSize ?? (quiz.smallTitle ? 26 : undefined);
  // After a wrong answer the right card isn't revealed: the learner gets to try again.
  const shownCorrectId = checked && !correct ? "" : quiz.correctId;
  const wrongNote = !correct && selectedId ? quiz.wrongBy?.[selectedId] : undefined;
  const line = quiz.line;
  // A picture above the answers (or one shown after a wrong try) needs them to rise less, so they don't reach it.
  const listRise = quiz.pictures || quiz.closeUp || quiz.wrongPicture ? LIST_RISE : LIST_RISE_OPEN;

  return (
    <LevelTwoShell
      step={quiz.step}
      total={SEQUENCE_STEPS}
      voiceover={checked ? quiz.resultVoiceover : quiz.voiceover}
      onBack={() => router.push(sequencePrevious(quiz.step))}
      scene={
        room ? (
          <SceneBackdrop dress={roomDress(room, checked, correct, cardsGone)} lifted={checked && !clearedRoom} />
        ) : "robot" in quiz.scene ? (
          <RobotBackdrop below={robotBelowDialogue(quiz.bubbleTop, quiz.bubble)} pose="idle" />
        ) : (
          <SoftBackdrop />
        )
      }
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Check") : quiz.noRetry ? "Continue" : correct ? "Next" : "Try again"}
      hint={{ visible: !checked, onUse: useHint }}
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
        <HexBubble key={attempt} entryKey={`sequence-${quiz.step}-${attempt}`} hex="left" line={line} size={quiz.bubble} leaving={checked && !quiz.hexStays} />
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
          pointedId={answerHint.pointedId}
          withHint
          rise={listRise}
          onPick={pick}
        />
      ) : (
        <TileCards
          layout="pair"
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          pointedId={answerHint.pointedId}
          withHint
          pictureWidth={quiz.pictureWidth}
          pictureHeight={quiz.pictureHeight}
          cardHeight={quiz.cardHeight}
          onPick={pick}
        />
      )}
      {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
      {answerHint.hand}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
