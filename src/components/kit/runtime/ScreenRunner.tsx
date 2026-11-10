"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GemPopup } from "@/components/level-one/GemPopup";
import { vibrateForAnswer } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import { Celebration } from "../feedback/Celebration";
import { ResultSheet } from "../feedback/ResultSheet";
import { HexGuide } from "../hex/HexGuide";
import { Backdrop } from "../layout/Backdrop";
import { RESULT_LIFT, ScreenFrame } from "../layout/ScreenFrame";
import { Answers } from "../options/Answers";
import type { ObjectOption } from "../options/OptionObjects";
import { TipCard } from "../text/TipCard";
import { LessonTitle } from "../text/LessonTitle";
import { ANSWERS_IN } from "../tokens";
import type { AnswerResult } from "../types";
import { hydrateNode } from "./hydrate";
import type { PlayableModule } from "./modules";
import { plainText } from "../markup";
import type { InteractionStageData, QuizStageData, StagedScreenData } from "./schema";

/** How far the body rises once a list of answers has its result sheet up (tiles rise `RESULT_LIFT`), and for an interaction that has a panel. */
const LIST_LIFT = 150;
const PANEL_LIFT = 215;
/** The least a picture is shrunk to fit its room. */
const MIN_FIT = 0.6;

/**
 * Plays one screen from its data: the title, Hex's line, the picture or interaction, the answers, the
 * hint, the check-and-try-again turn, the result sheet and the cheer, then on to the next screen by the module's flow.
 * A screen can have several stages (an interaction, then a question, or several questions). It is one
 * implementation of what the Data Types, Operators and Conditions screens each did, made of kit components.
 */
export function ScreenRunner({ mod, screen }: { mod: PlayableModule; screen: StagedScreenData }) {
  const router = useRouter();
  const { data, scoring } = mod;
  // Where modules differ in design (see `ModuleLook`).
  const look = data.look ?? {};
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  // Each try gets a fresh Hex: he left when the last one was checked.
  const [attempt, setAttempt] = useState(0);
  // An interaction stage's outcome.
  const [finished, setFinished] = useState(false);
  // Hex has said this stage's line.
  const [hexSpoken, setHexSpoken] = useState(false);
  // An interaction has sent Hex's line away early, to talk through its own Hex lower down.
  const [hexDismissed, setHexDismissed] = useState(false);
  const [gemOpen, setGemOpen] = useState(false);
  // What an interaction has taken the main button for (each press steps it on instead of going to the next stage).
  const [heldPress, setHeldPress] = useState<(() => void) | null>(null);
  const holdButton = useCallback((press: (() => void) | null) => setHeldPress(() => press), []);
  // Or a handler that says, on each press, whether it used the press.
  const continueHandler = useRef<(() => boolean) | null>(null);
  const takeContinue = useCallback((handler: (() => boolean) | null) => {
    continueHandler.current = handler;
  }, []);

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
  const quiz: QuizStageData | null = stage.kind === "quiz" ? stage : null;
  const interaction: InteractionStageData | null = stage.kind === "interaction" ? stage : null;
  const correct = !!quiz && selectedId === quiz.correctId;
  // A pick that is fine too is shown as right (the other right answer is not lit up beside it).
  const alsoOk = !!quiz && !!selectedId && !!quiz.alsoOk?.ids.includes(selectedId);
  const right = correct || alsoOk;
  const hasHint = !!quiz && (!!quiz.hintText || quiz.hintVisual !== undefined);
  const hintShown = hinted || (!!quiz?.hintOnMiss && attempt > 0);
  // A look-only stage can be gone on from once Hex has said all of his line (at once if he has none, or he has been sent away).
  const lookReady = !!interaction?.ready && (hexSpoken || hexDismissed || !interaction.line);

  const record = (clean: boolean) => {
    scoring.noteAnswer(screen.step, stageIndex, clean);
    if (!clean) scoring.noteStruggle(screen.step, "miss");
    vibrateForAnswer(clean);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: clean }));
  };

  // What an interaction calls: always the same functions, acting on the screen as it is now.
  const slipNow = useRef<() => void>(() => {});
  const finishNow = useRef<() => void>(() => {});
  const nextNow = useRef<() => void>(() => {});
  useEffect(() => {
    slipNow.current = () => record(false);
    finishNow.current = () => {
      if (finished) return;
      record(true);
      setFinished(true);
    };
    nextNow.current = advance;
  });
  const slip = useCallback(() => slipNow.current(), []);
  const done = useCallback(() => finishNow.current(), []);
  const next = useCallback(() => nextNow.current(), []);
  const dismissHex = useCallback(() => setHexDismissed(true), []);

  const check = () => {
    setChecked(true);
    record(right);
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  function advance() {
    if (lastStage) {
      if (screen.finish === "gem") setGemOpen(true);
      else router.push(mod.flow.next(screen.step));
      return;
    }
    setStageIndex((previous) => previous + 1);
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setHinted(false);
    setAttempt(0);
    setFinished(false);
    setHexSpoken(false);
    setHexDismissed(false);
    setHeldPress(null);
  }

  const onContinue = () => {
    if (!quiz) {
      if (continueHandler.current?.()) return;
      if (heldPress && !finished) heldPress();
      else advance();
    } else if (!checked) check();
    else if (right) advance();
    else tryAgain();
  };

  const useHint = () => {
    setHinted(true);
    scoring.noteStruggle(screen.step, "hint");
  };

  // A stage can be headed differently from its screen (a second part is headed differently from its first).
  const ownTitle = stage.title !== undefined;
  const titleText = stage.title ?? screen.title;
  const setSize = ownTitle ? stage.titleSize : screen.titleSize;
  const titleLength = plainText(titleText).length;
  const twoLines = setSize === undefined && titleLength > 25;

  const panel = quiz
    ? checked
      ? {
          right,
          title: correct ? quiz.rightTitle : alsoOk ? quiz.alsoOk!.title : (quiz.wrongTitle ?? "Not quite"),
          text: correct ? quiz.right : alsoOk ? quiz.alsoOk!.text : quiz.wrong,
        }
      : null
    : finished && interaction?.finishPanel
      ? { right: true, title: interaction.finishPanel.title, text: interaction.finishPanel.text }
      : null;

  // Hex's line for this stage (the hint replaces it).
  const line = quiz ? (hintShown && quiz.hintText ? quiz.hintText : quiz.line) : (interaction?.line ?? null);
  // A question can keep Hex and his line in place once it is checked.
  const lineStays = !!quiz?.keepLine;
  const lineGone = (quiz ? checked : finished || hexDismissed) && !lineStays;
  const lineTyped = !line || hexSpoken;

  // How a question's answers stand is the data's choice: rows, tiles (pictures), object cards (things to tap) or true / false.
  // Big cards (tiles, true / false) need the body lifted higher than rows or small object cards do.
  const answersLook = quiz?.answers ?? "rows";
  const bigCards = answersLook === "tiles" || answersLook === "trueFalse";
  const lift = panel ? (quiz ? (bigCards ? (look.tileLift ?? RESULT_LIFT) : answersLook === "objects" ? (look.tileLift ?? LIST_LIFT) : LIST_LIFT) : interaction?.finishPanel ? PANEL_LIFT : 0) : 0;
  // A line too long for Hex's bubble goes on a card.
  const cardLine = !!quiz && !!look.cardLine && line !== null && line.length > look.cardLine;
  const bubble = line === null ? undefined : (interaction?.bubbleWidth ?? look.bubble?.find((rule) => rule.upTo === undefined || line.length <= rule.upTo)?.width);
  const celebrate = panel?.right === true && (quiz ? checked : finished);
  // The pick that is shown as the right one: the right answer, or (for a pick that is fine too) the pick itself.
  const shownCorrectId = quiz ? (alsoOk ? (selectedId ?? quiz.correctId) : quiz.correctId) : "";
  const topAligned = interaction?.alignTop ?? !!look.topAligned;

  // What the module's interactions are told about Hex's line.
  const spoken = mod.hex === "spoken" ? hexSpoken : mod.hex === "typed" ? lineTyped : true;
  const api = { slip, done, dismissHex, finished, hexSpoken: spoken, lineTyped, takeContinue, holdButton, next };

  const backdrop = (
    <>
      {data.scene === undefined ? <Backdrop kind="soft" /> : hydrateNode(data.scene, {})}
      {screen.backdrop !== undefined && hydrateNode(screen.backdrop, {})}
    </>
  );

  return (
    <ScreenFrame
      step={screen.step}
      total={data.steps}
      onBack={() => router.push(mod.flow.previous(screen.step))}
      backdrop={backdrop}
      answer={answer}
      lift={lift}
      gap={quiz ? undefined : 24}
      spacing={8}
      full
      ctaDisabled={quiz ? selectedId === null : !finished && !lookReady && !heldPress}
      ctaLabel={
        quiz
          ? !checked
            ? (quiz.ctaLabel ?? "Continue")
            : right
              ? (quiz.nextLabel ?? "Next")
              : "Try again"
          : finished
            ? (interaction?.nextLabel ?? "Next")
            : (interaction?.ctaLabel ?? "Continue")
      }
      hint={hasHint ? { visible: !checked, onUse: useHint } : undefined}
      onContinue={onContinue}
      overlay={
        <>
          <ResultSheet correct={panel?.right ?? true} open={!!panel} title={panel?.title} text={panel?.text ?? ""} centred={look.sheet !== "side"} />
          {screen.finish === "gem" && (
            <GemPopup
              open={gemOpen}
              onClose={() => {
                setGemOpen(false);
                router.push(mod.href(data.afterGem ?? screen.step + 1));
              }}
            />
          )}
          <Celebration active={celebrate} />
        </>
      }
    >
      <LessonTitle key={ownTitle ? `${screen.step}-${stageIndex}` : screen.step} text={titleText} size={setSize} oneLine={!twoLines} width={twoLines ? COLUMN_W : undefined} className={twoLines ? "mx-auto mb-3" : ""} />

      {line && (
        <motion.div
          initial={false}
          animate={{ opacity: lineGone ? 0 : 1, height: lineGone ? 0 : "auto" }}
          transition={{ duration: 0.35 }}
          style={{ overflow: lineGone ? "hidden" : "visible" }}
          className="flex w-full shrink-0 justify-center px-4"
        >
          {cardLine ? (
            <div className="w-[340px]">
              <TipCard text={line} />
            </div>
          ) : (
            <HexGuide
              key={`${stageIndex}-${lineStays ? 0 : attempt}`}
              entryKey={`${data.id}-${screen.step}-${stageIndex}-${lineStays ? 0 : attempt}`}
              text={line}
              width={bubble}
              leaving={lineGone}
              onSpoken={() => setHexSpoken(true)}
            />
          )}
        </motion.div>
      )}

      <div ref={roomRef} className={`flex min-h-0 w-full flex-1 flex-col items-center ${interaction && topAligned ? "justify-start" : "justify-center"}`}>
        <div ref={pictureRef} className="flex flex-col items-center gap-2 transition-transform duration-300 ease-out" style={{ transform: `scale(${fit})`, transformOrigin: interaction && topAligned ? "top center" : "center" }}>
          {quiz ? hydrateNode(quiz.visual, { attempt, picked: selectedId, checked, correct, hexSpoken }) : interaction && <div key={stageIndex}>{hydrateNode(interaction.content, { api })}</div>}
          {quiz && quiz.hintVisual !== undefined && (
            <AnimatePresence>
              {hintShown && (
                <motion.div key="hint-visual" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  {hydrateNode(quiz.hintVisual, {})}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {quiz && (
        <motion.div key={`answers-${stageIndex}`} initial={quiz.optionsAfterHex ? false : { opacity: 0, y: 90 }} animate={{ opacity: 1, y: 0 }} transition={ANSWERS_IN} className="shrink-0" style={{ width: COLUMN_W }}>
          <Answers
            look={answersLook}
            yesNo={quiz.yesNo}
            question={quiz.question}
            options={quiz.options.map((option): ObjectOption => ({ ...option, media: option.node === undefined ? undefined : hydrateNode(option.node, {}) }))}
            selectedId={selectedId}
            onSelect={setSelectedId}
            checked={checked}
            correctId={shownCorrectId}
            revealCorrect={right}
            hintId={hintShown ? quiz.correctId : null}
            compact={quiz.compact}
            marks={false}
            spill={quiz.spill}
            stagger={quiz.optionsAfterHex}
            revealed={hexSpoken}
          />
        </motion.div>
      )}
    </ScreenFrame>
  );
}
