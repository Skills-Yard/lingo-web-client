"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import { TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { AnswerTray, TRAY_CARD_GAP, TRAY_LIST, TRAY_LIST_WIDTH, TRAY_PAIR } from "./AnswerTray";
import { CharacterOnStage, Column, SPEECH_STAGE, type SpeechStage } from "./CharacterStage";
import { PatternBackdrop } from "./PatternBackdrop";
import { BOARD, RoomBoard } from "./RoomBoard";
import type { RoomDress } from "./SequenceRoom";
import type { SequenceQuiz } from "./sequence";
import { SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";
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
/**
 * The tray look's character: head and chest close up (see `PortraitFraming`), its box from
 * Figma `top` 60 for this tall, which puts the head's top at about 198 (the title ends at 154);
 * it carries on behind the tray, which is see-through at its top edge (as in the design), and
 * only fades out (percent of its height) low down, under the answers, so it does not depend on
 * where the tray's top is on a given screen's height.
 */
const TRAY_CHARACTER = { top: 60, height: 690, fade: [84, 96] } as const;

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
 * `audio`, not the quiz's own clips. `position` is its place in the 3D flow (`sequence3d.ts`).
 *
 * `look` "tray" is the Figma `sequence_3` frame, for a pair of answers: the character stays
 * in the middle, close up, with no room beside it; the two cards stand on a grey tray at the
 * bottom, over a pattern background (see `PatternBackdrop`); the hint is the regular button beside Continue.
 */
export function SequenceQuiz3DScreen({ quiz, audio, position, look = "board" }: { quiz: SequenceQuiz; audio: SequenceQuiz3DAudio; position: number; look?: "board" | "tray" }) {
  const tray = look === "tray";
  const stand = quiz.layout === "list" ? TRAY_LIST : TRAY_PAIR;
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
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
  const room = !tray && "room" in quiz.scene ? quiz.scene.room : null;
  // The room stays put and the cards clear, so the boy is in view while he moves.
  const clearedRoom = !!room && (!!room.fixed || (!!room.clearOnRight && correct));
  const fadeCards = checked && clearedRoom;
  // The picture of the wrong try is shown where the board is, so the board gives way to it.
  const showsWrongPicture = !tray && !!quiz.wrongPicture && checked && !correct;

  useEffect(() => {
    if (!checked || !correct) return;
    const timer = window.setTimeout(() => setCardsGone(true), CARDS_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [checked, correct]);

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
    setRetried(true);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct || quiz.noRetry) router.push(sequence3dNext(position));
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
  const withHint = !quiz.noHint;
  const listRise = quiz.wrongPicture ? LIST_RISE : LIST_RISE_OPEN;
  const resultVoiceover = correct ? audio.right : audio.wrong;
  // The question when the screen opens, the result once checked; the buttons wait for whichever is playing to finish.
  const voiceover = checked ? resultVoiceover : retried ? undefined : audio.question;

  return (
    <LevelTwoShell
      step={position}
      total={SEQUENCE_3D_STEPS}
      voiceover={voiceover}
      onBack={() => router.push(sequence3dPrevious(position))}
      scene={room ? <RoomBoard dress={roomDress(room, checked, correct, cardsGone)} hidden={showsWrongPicture} shown={boardIn} /> : tray ? <PatternBackdrop /> : <SoftBackdrop />}
      answer={answer}
      ctaDisabled={selectedId === null || !spoken}
      ctaLabel={!checked ? (quiz.ctaLabel ?? "Continue") : quiz.noRetry ? "Continue" : correct ? "Next" : "Try again"}
      // The tray look uses the regular hint button, on the main button's row like every other quiz.
      hint={withHint ? { visible: !checked, onUse: useHint, disabled: !spoken } : undefined}
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
        <CharacterOnStage
          line={quiz.line}
          silenced={!voiceover}
          onStage={setStage}
          centered={tray || !boardIn}
          // The tray look opens with the character down by the main button; it rises as the answers come in.
          lowered={tray && !optionsShown}
          withHint={withHint}
          {...(tray ? { framing: "bust", top: stageTop(TRAY_CHARACTER.top), height: TRAY_CHARACTER.height, fade: TRAY_CHARACTER.fade } : {})}
        />
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

      {tray && <AnswerTray shown={optionsShown} gone={checked} stand={stand} withHint={withHint} />}

      {/* The answers aren't there until the character has said most of the question; then they slide up (their own entrance). */}
      {optionsShown && (quiz.layout === "list" ? (
        <AnswerCards
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          hinted={hinted}
          withHint={withHint}
          rise={listRise}
          {...(tray ? { bottomGap: TRAY_CARD_GAP, width: TRAY_LIST_WIDTH, endGap: 0 } : {})}
          onPick={setSelectedId}
        />
      ) : (
        <TileCards
          layout={tray ? "tray" : "pair"}
          choices={quiz.choices}
          correctId={shownCorrectId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          hinted={hinted}
          withHint={withHint}
          pictureWidth={tray ? undefined : quiz.pictureWidth}
          pictureHeight={tray ? undefined : quiz.pictureHeight}
          cardHeight={tray ? undefined : quiz.cardHeight}
          {...(tray ? { bottomGap: TRAY_CARD_GAP } : {})}
          onPick={setSelectedId}
        />
      ))}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
