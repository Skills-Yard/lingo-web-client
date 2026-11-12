"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { AnswerCards, GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { BELOW_TITLE, BottleBackdrop, ClassroomBackdrop, HEX_LIFT, ItemsBackdrop, MiniAppBackdrop, NamesBackdrop, ShopBackdrop, TrekBackdrop, VarCardBackdrop, WalletBackdrop } from "./scenes";
import { COLUMN_LEFT, type BubbleSize, type Choice } from "@/components/level-two/levelTwo";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED } from "@/components/ui/raised";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { COLUMN_W, SIDE_MARGIN } from "@/lib/questionColumn";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { fireSceneTrigger, type SceneName } from "@/lib/rive/variableHost";
import { TipCard } from "@/components/sequence/HexScreen";
import { parseTitle, type InteractionStage, type Option, type QuizStage, type ScreenDef } from "./quiz";
import { DRINK_HINT_STEPS, sceneOf, STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

/**
 * The answers' rows and the cards across: their heights and gaps (px). The cards are as tall as
 * their tiles (110px, see `TileCards`), with a little more room between them. The rows are
 * shorter than the list the other modules use (76px, see `AnswerCards`): the scene (about 306px
 * from under Hex's bubble, 262 of it picture) has to stay clear of three of them, both when a
 * question is open (they end above the button) and after a check (it has risen to the head and
 * they have risen clear of the result panel).
 */
const ROW_H = 60;
const ROW_GAP = 8;
const OBJECT_H = 110;
const OBJECT_GAP = 14;
/** Their text (px): the other modules' is 14 in the rows and 16 on the cards; these are two larger. */
const ROW_FONT = 16;
const CARD_FONT = 18;
/**
 * An answer at rest (rows and cards alike): a thin grey line all round (1px; the card adds `border`) and a very light
 * shade, so its top and sides show against the white page as well as the raised edge under it (a white border on white
 * left only that edge). Picking it swaps this for the 4px green or red look (see `LOOKS`).
 */
const IDLE_LOOK = "border-[#DCE2E9] bg-white drop-shadow-[0_1px_2px_rgba(31,42,68,0.07)] dark:border-white/10 dark:bg-[#15181E]";
/** The least a picture is shrunk to fit its room. */
const MIN_FIT = 0.6;
/** The result panel makes room by raising the answers this far (px). */
const RISE = 150;
/** The compact rows need no more than this to stand clear of the panel (it starts 600px down on a phone, they end 724 down), so they stop that much lower, under the scene that has risen to the head, rather than climbing over it. */
const COMPACT_ROWS_RISE = 132;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The answers' own way in. */
const ANSWERS_IN = { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } } as const;
/** A right answer sends the picture (a card on the screen) up this far (px) as it fades, like Hex and his bubble; a try again brings it back. */
const PICTURE_EXIT = 90;
const PICTURE_OUT = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;
const PICTURE_BACK = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;
/** A line longer than this goes on a card; a shorter one is Hex's. */
const BUBBLE_MAX_CHARS = 120;
/** The title block (px): where it ends, one line or two. */
const TITLE_END = { one: BELOW_TITLE, two: 163 } as const;

/** The scene behind a screen (see `sceneOf`); the trail says whether the river is gone. `lifted`: a right answer has sent Hex and his bubble away, and the scene rises into their room. */
const backdropFor = (scene: SceneName, step: number, lifted: boolean) => {
  switch (scene) {
    case "items":
      return <ItemsBackdrop lifted={lifted} />;
    case "bottle":
      return <BottleBackdrop lifted={lifted} />;
    case "names":
      return <NamesBackdrop lifted={lifted} />;
    case "varCard":
      return <VarCardBackdrop lifted={lifted} />;
    case "classroom":
      return <ClassroomBackdrop lifted={lifted} />;
    case "miniApp":
      return <MiniAppBackdrop lifted={lifted} />;
    case "shop":
      return <ShopBackdrop lifted={lifted} />;
    case "wallet":
      return <WalletBackdrop lifted={lifted} />;
    default:
      return <TrekBackdrop noWater={step === STEP.noWater} lifted={lifted} />;
  }
};

/** Hex's line is two lines at most: a short one fits the narrow bubble. */
const bubbleSize = (line: string): BubbleSize => ({ width: line.length <= 44 ? 190 : 240 });

/** Answers this short (and without a picture) stand as cards side by side; longer ones are rows. */
const SHORT_ANSWER_CHARS = 12;
/** The height of a card with words only. */
const TEXT_CARD_H = 84;

/** Four answers this short stand as two rows of two cards, on a screen with a picture (a card) that would otherwise have no room above four rows. */
const FOUR_ANSWER_CHARS = 18;

/**
 * Whether the answers are cards across (objects to tap, or three short answers; or four short ones, two by two, on a
 * screen with a picture) rather than rows.
 */
const acrossCards = (stage: QuizStage, withPicture: boolean) =>
  stage.layout === "grid" ||
  (stage.options.length === 3 && stage.options.every((option) => !option.icon && option.text.length <= SHORT_ANSWER_CHARS)) ||
  (withPicture && stage.options.length === 4 && stage.options.every((option) => !option.icon && !option.node && !option.emoji && option.text.length <= FOUR_ANSWER_CHARS));

const hasPictures = (options: readonly Option[]) => options.some((option) => option.node || option.emoji);
const columnsFor = (count: number) => (count === 3 ? 3 : 2);

/**
 * The answers on a screen with a picture (a card) are the shorter kind (see `AnswerCards`' `compact`; cards of words
 * are as short), so they stand lower, under the scene's characters, and the picture has room above them.
 */
const COMPACT_ROW_H = 56;
const COMPACT_ROW_GAP = 6;
const COMPACT_CARD_GAP = 8;
/** The gap between cards that have room to spare: the margin they keep from the screen's edges (a CSS length, in stage px). */
const SIDE_GAP = `calc(${SIDE_MARGIN}px / var(--stage-scale, 1))`;

/** Rows of answers in words, or cards to tap: the height they take. `compact`: the screen has a picture. */
const answersHeight = (stage: QuizStage, compact: boolean) => {
  if (!acrossCards(stage, compact)) {
    const rowHeight = compact ? COMPACT_ROW_H : ROW_H;
    const rowGap = compact ? COMPACT_ROW_GAP : ROW_GAP;
    return stage.options.length * rowHeight + (stage.options.length - 1) * rowGap;
  }
  const rows = Math.ceil(stage.options.length / columnsFor(stage.options.length));
  const cardHeight = hasPictures(stage.options) ? OBJECT_H : compact ? COMPACT_ROW_H : TEXT_CARD_H;
  return rows * cardHeight + (rows - 1) * (compact ? COMPACT_CARD_GAP : OBJECT_GAP);
};

const LETTERS = ["A", "B", "C", "D", "E"];

/** Cards to tap, side by side (three across, or two), in the place and the way the rows of answers stand. */
function ObjectGrid({
  options,
  correctId,
  selectedId,
  checked,
  fadeOut,
  hinted,
  withHint,
  spill,
  compact,
  spread,
  onPick,
}: {
  options: readonly Option[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out (a right answer clears the screen). */
  fadeOut: boolean;
  hinted: boolean;
  withHint: boolean;
  spill: boolean;
  /** The screen has a picture: cards of words are the shorter kind (see `COMPACT_ROW_H`). */
  compact: boolean;
  /** Nothing but the scene stands above them (no picture), so they have room to spare: with more than one row, the gap between cards is as wide as the margin at their sides. */
  spread: boolean;
  onPick: (id: string) => void;
}) {
  const pictures = hasPictures(options);
  // Several rows with room to spare: the cards are as far apart (across and down) as they are from the screen's edges (`SIDE_MARGIN` on the screen itself, so divided by the stage's scale), so the spacing is even all round.
  const gap = spread && options.length > columnsFor(options.length) ? SIDE_GAP : compact ? COMPACT_CARD_GAP : OBJECT_GAP;
  const wordsHeight = compact ? COMPACT_ROW_H : TEXT_CARD_H;
  const wordsFont = compact ? ROW_FONT : CARD_FONT;
  return (
    <motion.div
      initial={{ opacity: 0, y: 90 }}
      animate={{ opacity: fadeOut ? 0 : 1, y: checked ? -RISE : 0 }}
      transition={checked ? { y: PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : ANSWERS_IN}
      className="pointer-events-auto absolute z-[1] grid"
      // Equal columns, except that a card of words is never narrower than its words (`water_level` is wider than a third of the column at this size), so the text stays inside it.
      style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, withHint), left: COLUMN_LEFT, width: COLUMN_W, gap, gridTemplateColumns: `repeat(${columnsFor(options.length)}, minmax(${pictures ? "0px" : "min-content"}, 1fr))` }}
    >
      {options.map((option) => {
        const state = optionState(option.id, selectedId, checked, correctId);
        const hintHere = hinted && selectedId === null && option.id === correctId;
        const spilling = spill && checked && state === "wrong";
        return (
          <HintFloat key={option.id} className="relative flex min-w-0" spin={false} active={hintHere}>
            <motion.button
              type="button"
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                onPick(option.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, x: spilling ? [0, -5, 5, -4, 4, 0] : 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: pictures ? OBJECT_H : wordsHeight }}
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-visible rounded-[16px] ${RAISED} ${LOOKS[state].edge} ${
                // The side padding makes up the border's width (1px + 9px, or 4px + 6px), so a card is as wide picked as at rest and nothing around it moves.
                state === "idle" ? `border px-[9px] ${IDLE_LOOK}` : `border-4 px-1.5 ${LOOKS[state].card}`
              }`}
            >
              <motion.span
                aria-hidden
                initial={false}
                animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
                className="pointer-events-none absolute inset-0 -z-10 rounded-[12px] bg-[#FFE7D1] dark:bg-[#33220F]"
              />
              {pictures && <span className="flex h-[54px] items-center justify-center text-[44px] leading-none">{option.node ?? option.emoji}</span>}
              <span className={`text-center leading-6 font-semibold text-[#444444] dark:text-white ${pictures ? "" : "whitespace-nowrap"}`} style={{ fontSize: wordsFont }}>
                {option.text}
              </span>
              <AnimatePresence>
                {spilling &&
                  [0, 1, 2, 3, 4].map((drop) => (
                    <motion.span
                      key={drop}
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 text-[18px] leading-none"
                      style={{ left: `${20 + drop * 15}%` }}
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: [0, 1, 0], y: [0, 36, 70] }}
                      transition={{ duration: 1, delay: drop * 0.12, repeat: 1 }}
                    >
                      💧
                    </motion.span>
                  ))}
              </AnimatePresence>
            </motion.button>
          </HintFloat>
        );
      })}
    </motion.div>
  );
}

/** An interaction stage's own picture and controls. */
function InteractionHost({ stage, slip, done, finished }: { stage: InteractionStage; slip: () => void; done: () => void; finished: boolean }) {
  return <>{stage.render({ slip, done, finished })}</>;
}

/**
 * A Variable screen: its title, then its stages one after another (most have
 * one). A question stage shows what Hex says (or a card, for a long line), a
 * picture and the answers; Continue checks the pick and the
 * result panel (with Hex) slides up. A right answer goes on; a wrong one is
 * tried again, with the right one never shown. An interaction stage is
 * something to do (tap, drag, slide) that unlocks Continue when it is done.
 * Going on from the last stage follows the module's flow (skips and detours).
 */
export function VariableQuizScreen({ screen }: { screen: ScreenDef }) {
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
  // The picture is shrunk to fit the room between the line and the answers, if it is taller than that.
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

  const sceneKind = sceneOf(screen.step);
  const stage = screen.stages[stageIndex];
  const lastStage = stageIndex === screen.stages.length - 1;
  const quiz = stage.kind === "quiz" ? stage : null;
  const interaction = stage.kind === "interaction" ? stage : null;
  const correct = !!quiz && selectedId === quiz.correctId;
  const alsoOk = !!quiz && !!selectedId && !!quiz.alsoOk?.ids.includes(selectedId);
  const right = correct || alsoOk;
  // A pick that is fine too is shown as right (the other right answer isn't lit up beside it).
  const shownCorrectId = checked && !right ? "" : alsoOk ? (selectedId ?? "") : (quiz?.correctId ?? "");
  const hasHint = !!quiz && (!!quiz.hintText || !!quiz.hintVisual);
  const hintShown = hinted || (!!quiz?.hintOnMiss && attempt > 0);
  // A right answer clears the screen: the answers fade out and, as Hex and his bubble run off, the scene rises into their room. (A wrong one keeps the answers, for another try.)
  const cleared = !!quiz && checked && right;
  // Hex and his bubble leave after any check, right or wrong, and the scene rises into their room at the head, clear of the answers that rise from below (a wrong answer's stay for another try).
  const sceneLifted = !!quiz && checked;

  const record = (clean: boolean) => {
    noteAnswer(screen.step, stageIndex, clean);
    if (!clean) noteStruggle(screen.step, "miss");
    // The trail behind cheers a right answer, and points at the drink after a wrong one on the first screens.
    if (sceneKind === "trek") {
      if (clean) fireSceneTrigger("trek", "cheer");
      else if (DRINK_HINT_STEPS.includes(screen.step)) fireSceneTrigger("trek", "drinkHint");
    }
    vibrateForAnswer(clean);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: clean }));
  };

  // The labelled bottles are shuffled when the screen opens, and again for each new try.
  useEffect(() => {
    if (sceneKind === "names") fireSceneTrigger("names", "shuffle");
  }, [sceneKind, attempt]);

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

  const advance = () => {
    if (lastStage) {
      router.push(variableNext(screen.step));
      return;
    }
    setStageIndex((previous) => previous + 1);
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setHinted(false);
    setAttempt(0);
    setFinished(false);
  };

  const onContinue = () => {
    if (!quiz) advance();
    else if (!checked) check();
    else if (right) advance();
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
      ? {
          right,
          title: correct ? quiz.rightTitle : alsoOk ? quiz.alsoOk!.title : (quiz.wrongTitle ?? "Not quite"),
          text: correct ? quiz.right : alsoOk ? quiz.alsoOk!.text : quiz.wrong,
        }
      : null
    : finished && interaction?.finishPanel
      ? { right: true, title: interaction.finishPanel.title, text: interaction.finishPanel.text }
      : null;

  // What stands under the line: the picture and the answers (question stage), or the interaction.
  const answersBottom = quiz ? aboveButtons(GAP_ABOVE_BUTTONS, hasHint) : "0px";
  // A screen with a card (the picture has a height; one that only moves the scene has none) gets the shorter rows, and so does a question that asks for them (a scene that needs the room).
  const compactRows = !!quiz?.compact || pictureHeight > 0;
  const bodyBottom = quiz ? `calc(${answersBottom} + ${answersHeight(quiz, compactRows) + 18}px)` : aboveButtons(24);

  const choices: readonly Choice[] = quiz ? quiz.options.map((option, index) => ({ id: option.id, text: option.text, icon: option.icon ?? "", badge: LETTERS[index] })) : [];
  const longLine = !!quiz && quiz.line.length > BUBBLE_MAX_CHARS;
  const celebrate = checked && right;

  return (
    <LevelTwoShell
      step={screen.step}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(screen.step))}
      scene={backdropFor(sceneKind, screen.step, sceneLifted)}
      answer={answer}
      ctaDisabled={quiz ? selectedId === null : !finished}
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
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={panel?.right ?? true}
            title={panel?.title}
            open={!!panel}
            hexIn={!!panel}
            hexCue={panel?.right ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            grouped
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

      {quiz ? (
        <>
          <div
            className="absolute inset-x-0 flex flex-col items-center gap-2 transition-[padding] duration-500 ease-out"
            style={{ top: titleEnd, bottom: bodyBottom, paddingBottom: checked ? RISE : 0 }}
          >
            <motion.div
              initial={false}
              animate={{ opacity: checked ? 0 : 1, height: checked ? 0 : "auto" }}
              transition={{ duration: 0.35 }}
              // Hex's bubble is lifted (see `HEX_LIFT`), clear of the picture's top; only it moves, what is under it stays where it was.
              style={{ overflow: checked ? "hidden" : "visible", top: longLine ? 0 : -HEX_LIFT }}
              className="relative flex w-full shrink-0 justify-center px-4"
            >
              {longLine ? (
                <div className="w-[340px]">
                  <TipCard>{hintShown && quiz.hintText ? quiz.hintText : quiz.line}</TipCard>
                </div>
              ) : (
                <HexBubble
                  key={`${stageIndex}-${attempt}`}
                  entryKey={`variable-${screen.step}-${stageIndex}-${attempt}`}
                  hex="left"
                  line={[{ text: hintShown && quiz.hintText ? quiz.hintText : quiz.line }]}
                  size={bubbleSize(hintShown && quiz.hintText ? quiz.hintText : quiz.line)}
                  leaving={checked}
                />
              )}
            </motion.div>
            {/* The picture stands on the answers (the room's bottom), not in the middle of the room, so it is off the scene's upper half. A right answer sends it up and away, as it does Hex and his bubble. */}
            <div ref={roomRef} className="flex min-h-0 w-full flex-1 flex-col items-center justify-end">
              <motion.div
                ref={pictureRef}
                initial={false}
                animate={{ opacity: cleared ? 0 : 1, y: cleared ? -PICTURE_EXIT : 0 }}
                transition={cleared ? PICTURE_OUT : PICTURE_BACK}
                className="flex flex-col items-center gap-2"
                style={{ scale: fit, originY: 1, pointerEvents: cleared ? "none" : undefined }}
              >
                {quiz.visual?.({ attempt, picked: selectedId, checked, correct })}
                <AnimatePresence>
                  {hintShown && quiz.hintVisual && (
                    <motion.div key="hint-visual" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      {quiz.hintVisual}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {acrossCards(quiz, compactRows) ? (
            <ObjectGrid
              options={quiz.options}
              correctId={shownCorrectId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={cleared}
              hinted={hintShown}
              withHint={hasHint}
              spill={!!quiz.spill}
              compact={compactRows}
              spread={pictureHeight === 0}
              onPick={setSelectedId}
            />
          ) : (
            <AnswerCards
              choices={choices}
              correctId={shownCorrectId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={cleared}
              hinted={hintShown}
              withHint={hasHint}
              rise={compactRows ? COMPACT_ROWS_RISE : RISE}
              compact={compactRows}
              idleLook={IDLE_LOOK}
              gap={compactRows ? COMPACT_ROW_GAP : ROW_GAP}
              fontSize={ROW_FONT}
              onPick={setSelectedId}
            />
          )}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ top: titleEnd, bottom: bodyBottom }}>
          {interaction && <InteractionHost stage={interaction} slip={slip} done={done} finished={finished} />}
        </div>
      )}

      <Confetti active={celebrate || (finished && !!panel)} />
      <XpBurst show={celebrate || (finished && !!panel)} />
    </LevelTwoShell>
  );
}
