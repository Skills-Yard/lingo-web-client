"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { AnswerCards, CARDS_RISE, GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT, type BubbleSize } from "@/components/level-two/levelTwo";
import { TileCards } from "@/components/level-two/TileCards";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { COLUMN_W } from "@/lib/questionColumn";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { OPERATORS_STEPS, operatorsNext, operatorsPrevious } from "./operators";
import { noteAnswer, noteStruggle } from "./operatorsScore";
import { parseTitle, type InteractionStage, type QuizStage, type ScreenDef } from "./screen";

/** A row of the list of answers (a compact one, for words only), and the gap between rows (see `AnswerCards`). */
const ROW_H = 76;
const ROW_H_COMPACT = 56;
const ROW_GAP = 6;
/** The tiles: a card's height by how many there are, and the gap between rows. */
const TILE_H = { 2: 184, 3: 110, 4: 104 } as const;
const TILE_GAP = 14;
/** How far the list of answers rises once the result panel is up (the tiles rise `CARDS_RISE`). */
const LIST_RISE = 150;
/** How much room the result panel takes from an interaction's area once it is up. */
const PANEL_ROOM = 215;
/** The least a picture is shrunk to fit its room. */
const MIN_FIT = 0.6;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The answers' own way in, so a question standing on them comes in with them. */
const ANSWERS_IN = { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } } as const;
/** The title block (px): where it ends, one line or two. */
const TITLE_END = { one: 125, two: 163 } as const;
/** How many letters of a question fit a line, for the room it takes. */
const QUESTION_CHARS = 36;

const bubbleSize = (line: string): BubbleSize => ({ width: line.length <= 50 ? 190 : line.length <= 90 ? 240 : 262 });

/** How the answers stand: rows, or tiles (two, three or four across and down). */
const tileCount = (stage: QuizStage) => Math.min(4, Math.max(2, stage.options.length)) as 2 | 3 | 4;

const answersHeight = (stage: QuizStage) => {
  if (stage.layout === "grid") return tileCount(stage) === 4 ? TILE_H[4] * 2 + TILE_GAP : TILE_H[tileCount(stage)];
  const row = stage.compact ? ROW_H_COMPACT : ROW_H;
  return stage.options.length * row + (stage.options.length - 1) * ROW_GAP;
};

/** An interaction stage's own picture and controls. */
function InteractionHost({
  stage,
  slip,
  done,
  finished,
  lineTyped,
  holdButton,
  next,
}: {
  stage: InteractionStage;
  slip: () => void;
  done: () => void;
  finished: boolean;
  lineTyped: boolean;
  holdButton: (press: (() => void) | null) => void;
  next: () => void;
}) {
  return <>{stage.render({ slip, done, finished, lineTyped, holdButton, next })}</>;
}

/**
 * An Operators screen, in the Sequence and Command modules' design: the
 * headline, Hex's short line, a picture, and the answers (rows with a picture,
 * or tiles). Continue checks the pick and the result panel (with Hex) slides
 * up; a right answer goes on and a wrong one is tried again, with the right one
 * never shown. A screen can have several stages (an interaction, then a
 * question, or several questions). An interaction stage is something to do (tap,
 * share, build an expression) that unlocks Continue when it is done. Going on
 * from the last stage follows the module's flow (skips and detours).
 */
export function OperatorsScreen({ screen }: { screen: ScreenDef }) {
  const router = useRouter();
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  // Each try gets a fresh Hex: he left when the last one was checked.
  const [attempt, setAttempt] = useState(0);
  // An interaction stage's outcome.
  const [finished, setFinished] = useState(false);
  // Hex has typed this stage's line to the end (an interaction can wait for it).
  const [lineIsTyped, setLineIsTyped] = useState(false);
  const onLineTyped = useCallback(() => setLineIsTyped(true), []);
  // What an interaction has taken the main button for (each press steps it on instead of going to the next stage).
  const [heldPress, setHeldPress] = useState<(() => void) | null>(null);
  const holdButton = useCallback((press: (() => void) | null) => setHeldPress(() => press), []);
  // The picture is shrunk to fit the room between Hex's line and the question, if it is taller than that.
  const [roomHeight, setRoomHeight] = useState(0);
  const [pictureHeight, setPictureHeight] = useState(0);
  const roomRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(() => setRoomHeight(element.clientHeight));
    observer.observe(element);
    setRoomHeight(element.clientHeight);
    return () => observer.disconnect();
  }, []);
  const pictureRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(() => setPictureHeight(element.offsetHeight));
    observer.observe(element);
    setPictureHeight(element.offsetHeight);
    return () => observer.disconnect();
  }, []);
  const fit = roomHeight > 0 && pictureHeight > 0 ? Math.max(MIN_FIT, Math.min(1, roomHeight / pictureHeight)) : 1;

  const stage = screen.stages[stageIndex];
  const lastStage = stageIndex === screen.stages.length - 1;
  const quiz = stage.kind === "quiz" ? stage : null;
  const interaction = stage.kind === "interaction" ? stage : null;
  const correct = !!quiz && selectedId === quiz.correctId;
  const hasHint = !!quiz?.hintText;

  const record = (clean: boolean) => {
    noteAnswer(screen.step, stageIndex, clean);
    if (!clean) noteStruggle(screen.step, "miss");
    vibrateForAnswer(clean);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: clean }));
  };

  // What an interaction calls: always the same functions, acting on the screen as it is now.
  const slipNow = useRef<() => void>(() => {});
  const finishNow = useRef<() => void>(() => {});
  useEffect(() => {
    slipNow.current = () => record(false);
    finishNow.current = () => {
      if (finished) return;
      record(true);
      setFinished(true);
    };
  });
  const slip = useCallback(() => slipNow.current(), []);
  const done = useCallback(() => finishNow.current(), []);
  // An interaction can send the learner straight on to the next stage (`advance` is defined below).
  const nextNow = useRef<() => void>(() => {});
  const next = useCallback(() => nextNow.current(), []);

  const check = () => {
    setChecked(true);
    record(correct);
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setLineIsTyped(false);
    setAttempt((previous) => previous + 1);
  };

  const advance = () => {
    if (lastStage) {
      router.push(operatorsNext(screen.step));
      return;
    }
    setStageIndex((previous) => previous + 1);
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setHinted(false);
    setAttempt(0);
    setFinished(false);
    setLineIsTyped(false);
  };

  useEffect(() => {
    nextNow.current = advance;
  });

  const onContinue = () => {
    if (!quiz) {
      if (heldPress && !finished) heldPress();
      else advance();
    }
    else if (!checked) check();
    else if (correct) advance();
    else tryAgain();
  };

  const useHint = () => {
    setHinted(true);
    noteStruggle(screen.step, "hint");
  };

  const title = parseTitle(screen.title);
  const titleEnd = title.twoLines ? TITLE_END.two : TITLE_END.one;
  const panel = quiz
    ? checked
      ? { right: correct, title: correct ? quiz.rightTitle : (quiz.wrongTitle ?? "Not quite"), text: correct ? quiz.right : quiz.wrong }
      : null
    : finished && interaction?.finishPanel
      ? { right: true, title: interaction.finishPanel.title, text: interaction.finishPanel.text }
      : null;

  // Hex's line for this stage (the hint replaces it).
  const line = quiz ? (hinted && quiz.hintText ? quiz.hintText : quiz.line) : (interaction?.line ?? null);
  const gone = quiz ? checked : finished;
  // A question can keep Hex and his line in place once it is checked (they do not leave, nor come back with each try).
  const lineStays = !!quiz?.keepLine;
  const lineGone = gone && !lineStays;
  // With no line there is nothing to wait for.
  const lineTyped = !line || lineIsTyped;

  // What stands under the line: the picture, the question and the answers (question stage), or the interaction.
  const tiles = !!quiz && quiz.layout === "grid";
  const answersBottom = quiz ? aboveButtons(GAP_ABOVE_BUTTONS, hasHint) : "0px";
  const questionLines = quiz?.question ? Math.ceil(quiz.question.length / QUESTION_CHARS) : 0;
  const questionHeight = questionLines ? questionLines * 22 + 14 : 0;
  const bodyBottom = quiz ? `calc(${answersBottom} + ${answersHeight(quiz) + 10 + questionHeight + 8}px)` : aboveButtons(24);
  // Once the result panel is up, the answers rise and the room under the line shrinks by as much.
  const risen = quiz ? (tiles ? CARDS_RISE : LIST_RISE) : interaction?.finishPanel ? PANEL_ROOM : 0;
  const celebrate = panel?.right === true && (quiz ? checked : finished);

  return (
    <LevelTwoShell
      step={screen.step}
      total={OPERATORS_STEPS}
      onBack={() => router.push(operatorsPrevious(screen.step))}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaDisabled={quiz ? selectedId === null : !finished && !heldPress}
      ctaLabel={
        quiz
          ? !checked
            ? (quiz.ctaLabel ?? "Continue")
            : correct
              ? (quiz.nextLabel ?? "Next")
              : "Try again"
          : finished
            ? (interaction?.nextLabel ?? "Next")
            : (interaction?.ctaLabel ?? "Continue")
      }
      hint={hasHint ? { visible: !checked, onUse: useHint } : undefined}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={panel?.right ?? true}
            title={panel?.title}
            open={!!panel}
            hexIn={!!panel}
            hexCue={panel?.right ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {panel?.text ?? ""}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle key={screen.step} oneLine={!title.twoLines}>
        <span style={{ fontSize: title.size }}>
          {title.parts.map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="text-level-gradient">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      </ScreenTitle>

      <div
        className="absolute inset-x-0 flex flex-col items-center gap-2 transition-[padding] duration-500 ease-out"
        style={{ top: titleEnd, bottom: bodyBottom, paddingBottom: gone ? risen : 0 }}
      >
        {line && (
          <motion.div
            initial={false}
            animate={{ opacity: lineGone ? 0 : 1, height: lineGone ? 0 : "auto" }}
            transition={{ duration: 0.35 }}
            style={{ overflow: lineGone ? "hidden" : "visible" }}
            className="flex w-full shrink-0 justify-center px-4"
          >
            <HexBubble
              key={`${stageIndex}-${lineStays ? 0 : attempt}`}
              entryKey={`operators-${screen.step}-${stageIndex}-${lineStays ? 0 : attempt}`}
              hex="left"
              line={[{ text: line }]}
              size={bubbleSize(line)}
              leaving={lineGone}
              onTyped={onLineTyped}
            />
          </motion.div>
        )}
        <div ref={roomRef} className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <div ref={pictureRef} className="flex flex-col items-center gap-2" style={{ transform: `scale(${fit})` }}>
            {quiz ? (
              quiz.visual?.({ attempt, picked: selectedId, checked, correct })
            ) : (
              interaction && <InteractionHost key={stageIndex} stage={interaction} slip={slip} done={done} finished={finished} lineTyped={lineTyped} holdButton={holdButton} next={next} />
            )}
          </div>
        </div>
      </div>

      {quiz && (
        <>
          {quiz.question && (
            <motion.p
              key={`q-${stageIndex}`}
              initial={{ opacity: 0, y: 90 }}
              animate={{ opacity: 1, y: checked ? -(tiles ? CARDS_RISE : LIST_RISE) : 0 }}
              transition={checked ? PANEL_SPRING : ANSWERS_IN}
              className="absolute z-[1] rounded-[12px] bg-white/85 px-3 py-1.5 text-center text-[16px] leading-[22px] font-semibold text-[#444444] dark:bg-[#15181E]/85 dark:text-white"
              style={{ bottom: `calc(${answersBottom} + ${answersHeight(quiz) + 10}px)`, left: COLUMN_LEFT, width: COLUMN_W }}
            >
              {quiz.question}
            </motion.p>
          )}
          {tiles ? (
            <TileCards
              key={`tiles-${stageIndex}`}
              layout={tileCount(quiz) === 2 ? "pair" : tileCount(quiz) === 3 ? "tiles" : "grid"}
              choices={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={false}
              hinted={hinted}
              withHint={hasHint}
              onPick={setSelectedId}
            />
          ) : (
            <AnswerCards
              key={`rows-${stageIndex}`}
              choices={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={false}
              hinted={hinted}
              withHint={hasHint}
              rise={LIST_RISE}
              compact={quiz.compact}
              onPick={setSelectedId}
            />
          )}
        </>
      )}

      <Confetti active={celebrate} />
      <XpBurst show={celebrate} />
    </LevelTwoShell>
  );
}
