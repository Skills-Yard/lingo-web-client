"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards, GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText, underAbove } from "@/components/level-two/LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue, robotUnder } from "@/components/level-two/RobotBackdrop";
import { SlotImage } from "@/components/level-two/SlotImage";
import { TILE_HEIGHT, TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { PictureCards } from "./PictureCards";
import { roomUnder, SceneBackdrop } from "./SceneBackdrop";
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
/**
 * The answers hang right under what is above them (the pictures, the room, the robot, Hex's line), this far (px) below it,
 * so on a tall screen the spare room is left above the button rather than between them and the picture.
 */
const GAP_UNDER = 12;
/** An answer row's height and the gap between rows (`AnswerCards`' own), for placing the list. */
const ROW_H = 76;
const ROW_GAP = 6;
/** The result panel's top edge on the 844px stage, and the room the answers keep above it, for how far they must rise to clear it. */
const PANEL_TOP = 583;
const PANEL_CLEARANCE = 10;

/** The bottom edge (stage px) of a block that hangs from a fixed top, as it is laid out (`null` until it has been); it follows the block as it changes. */
function useBottomEdge(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [bottom, setBottom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const measure = () => setBottom(element.offsetTop + element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);
  return [ref, bottom] as const;
}

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
  const [picturesRef, picturesBottom] = useBottomEdge(!!quiz.pictures);
  const [closeUpRef, closeUpBottom] = useBottomEdge(!!quiz.closeUp);
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
  // The answers hang right under what is above them, not up from the button row: the pictures, the room, the robot, or Hex's line.
  const picturesAbove = !!quiz.pictures || !!quiz.closeUp;
  const aboveBottom = quiz.pictures ? picturesBottom : quiz.closeUp ? closeUpBottom : null;
  const bubbleBottom = robotBelowDialogue(quiz.bubbleTop, quiz.bubble);
  const optionsHeight = quiz.layout === "list" ? quiz.choices.length * ROW_H + (quiz.choices.length - 1) * ROW_GAP : (quiz.cardHeight ?? TILE_HEIGHT.pair);
  const under = picturesAbove ? (aboveBottom === null ? null : `${aboveBottom + GAP_UNDER}px`) : room ? roomUnder : "robot" in quiz.scene ? robotUnder(bubbleBottom) : `${bubbleBottom + GAP_UNDER}px`;
  const optionsTop = under === null ? undefined : underAbove(under, optionsHeight, GAP_ABOVE_BUTTONS, true);
  // How far they rise once the result panel is up. With pictures above they go up with them (the pictures' own rise, or a little more where that does not clear the panel); under Hex's line alone they only go as far as they must to clear the panel (none, usually); a picture shown after a wrong try needs them to rise less, so they don't reach it.
  const listRise = picturesAbove
    ? Math.max(PICTURES_RISE, (aboveBottom ?? 0) + GAP_UNDER + optionsHeight - (PANEL_TOP - PANEL_CLEARANCE))
    : !room && "plain" in quiz.scene
      ? Math.max(0, bubbleBottom + GAP_UNDER + optionsHeight - (PANEL_TOP - PANEL_CLEARANCE))
      : quiz.wrongPicture
        ? LIST_RISE
        : LIST_RISE_OPEN;

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
          ref={picturesRef}
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
          ref={closeUpRef}
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
          top={optionsTop}
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
          top={optionsTop}
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
