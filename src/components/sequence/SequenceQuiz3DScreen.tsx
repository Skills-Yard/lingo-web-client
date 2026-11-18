"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import { TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { CharacterOnStage, Column, SPEECH_STAGE, type SpeechStage } from "./CharacterStage";
import { BOARD, RoomBoard } from "./RoomBoard";
import type { RoomDress } from "./SequenceRoom";
import { SEQUENCE_STEPS, type SequenceQuiz } from "./sequence";
import { sequence3dNext, sequence3dPrevious } from "./sequence3d";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

/*
 * A Sequence question (screens 1 and 7) with the 3D character in Hex's place. Same
 * rules as `SequenceQuizScreen`, which this was copied from, for a quiz that is a
 * list or a pair of answers over a room; the pictures to compare and the close-up
 * are left out. There is no speech bubble: the question is the voiceover. The
 * character is as tall as the room between the header and the main button, with the
 * answers drawn over it; it is only ever shown (never turned or tapped). It starts
 * in the middle of the screen; once a fifth of the question has been said it goes to
 * the far left and the room, on a board (see `RoomBoard`), slides in beside it; at
 * three quarters the answers come in. Everything else on the screen is a backdrop,
 * text or a button.
 */

/** How long the cards take to rise and fade after a right answer, before the boy moves. */
const CARDS_CLEAR_MS = 700;
/** A list of answers only has to clear the result panel; there is a picture to keep in view above it. */
const LIST_RISE = 150;
/** With nothing above them, the answers rise further, well clear of the panel. */
const LIST_RISE_OPEN = 210;

type RoomScene = Extract<SequenceQuiz["scene"], { room: unknown }>["room"];

/** What the boy has on: the start until checked, then the right or wrong result (a cleared room's right result waits for the cards to go). */
const roomDress = (room: RoomScene, checked: boolean, correct: boolean, cardsGone: boolean): RoomDress => {
  if (!checked) return room.start;
  if (!correct) return room.wrong;
  return room.clearOnRight && !cardsGone ? room.start : room.right;
};

/** What the character says: when the screen opens, and (where there is one) once the answer is checked, right or wrong. */
export type SequenceQuiz3DAudio = {
  question: readonly string[];
  right?: readonly string[];
  wrong?: readonly string[];
};

/**
 * A Sequence question, the 3D way: the title, the character at the left (it asks
 * the question aloud), the boy's room on its board, and the answers. The main button
 * checks the pick and the result panel slides up. A right answer moves on; a wrong
 * one is tried again on the spot (unless the question is `noRetry`). The voice is
 * `audio`, not the quiz's own clips.
 */
export function SequenceQuiz3DScreen({ quiz, audio }: { quiz: SequenceQuiz; audio: SequenceQuiz3DAudio }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  // The hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  // A wrong answer has been tried again: the question is not asked a second time.
  const [retried, setRetried] = useState(false);
  // How far the character is in what it says (the question, then the result): the main button and the hint stay off until it has said it all.
  const [stage, setStage] = useState<SpeechStage>(SPEECH_STAGE.opening);
  const spoken = stage === SPEECH_STAGE.done;
  // The board comes in when a fifth of the question is said and the answers at three quarters; they stay
  // (they don't go again when the result's voice starts the character's count over).
  const [reached, setReached] = useState<SpeechStage>(SPEECH_STAGE.opening);
  if (stage > reached) setReached(stage);
  const boardIn = reached >= SPEECH_STAGE.board;
  const optionsShown = reached >= SPEECH_STAGE.options;
  // A right answer in a `clearOnRight` room: the boy waits until the cards have gone, then moves.
  const [cardsGone, setCardsGone] = useState(false);
  const correct = selectedId === quiz.correctId;
  const room = "room" in quiz.scene ? quiz.scene.room : null;
  // The room stays put and the cards clear, so the boy is in view while he moves.
  const clearedRoom = !!room && (!!room.fixed || (!!room.clearOnRight && correct));
  const fadeCards = checked && clearedRoom;
  // The picture of the wrong try is shown where the board is, so the board gives way to it.
  const showsWrongPicture = !!quiz.wrongPicture && checked && !correct;

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
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setRetried(true);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct || quiz.noRetry) router.push(sequence3dNext(quiz.step));
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
  const listRise = quiz.wrongPicture ? LIST_RISE : LIST_RISE_OPEN;
  const resultVoiceover = correct ? audio.right : audio.wrong;
  // The question when the screen opens, the result once checked; the buttons wait for whichever is playing to finish.
  const voiceover = checked ? resultVoiceover : retried ? undefined : audio.question;

  return (
    <LevelTwoShell
      step={quiz.step}
      total={SEQUENCE_STEPS}
      voiceover={voiceover}
      onBack={() => router.push(sequence3dPrevious(quiz.step))}
      scene={room ? <RoomBoard dress={roomDress(room, checked, correct, cardsGone)} hidden={showsWrongPicture} shown={boardIn} /> : <SoftBackdrop />}
      answer={answer}
      ctaDisabled={selectedId === null || !spoken}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Check") : quiz.noRetry ? "Continue" : correct ? "Next" : "Try again"}
      hint={{ visible: !checked, onUse: useHint, disabled: !spoken }}
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
      <Column>
        {/* Silent when there is nothing to say: once checked with no result voice of its own (screen 1 has one for right and wrong), or on a retry. */}
        <CharacterOnStage line={quiz.line} silenced={!voiceover} onStage={setStage} centered={!boardIn} withHint />
        <AnimatePresence>
          {quiz.wrongPicture && showsWrongPicture && (
            <motion.div
              key="wrong-picture"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="absolute"
              style={{ left: BOARD.left + (BOARD.width - quiz.wrongPicture.width) / 2, top: stageTop(quiz.wrongPicture.top) }}
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
      </Column>

      <ScreenTitle key={quiz.resultTitle && checked ? "result" : "ask"} oneLine={!quiz.wrapTitle}>
        <span style={titleSize ? { fontSize: titleSize } : undefined}>
          <TitleText lines={title} />
        </span>
      </ScreenTitle>

      {/* The answers aren't there until the character has said most of the question; then they slide up (their own entrance). */}
      {optionsShown && (quiz.layout === "list" ? (
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
      ))}
      {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
      {answerHint.hand}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
