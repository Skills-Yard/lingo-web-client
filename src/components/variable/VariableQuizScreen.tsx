"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { PointedLook, useAnswerHint } from "@/components/level-one/answerHint";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { BELOW_TITLE, BottleBackdrop, BottleWalletBackdrop, ClassroomBackdrop, GAP_BELOW_SCENE, HEX_LIFT, ItemsBackdrop, MiniAppBackdrop, NamesBackdrop, SCENE_BOTTOM_LIFTED_PHONE, ShopBackdrop, TrekBackdrop, VarCardBackdrop, WalletBackdrop } from "./scenes";
import { COLUMN_LEFT, type Choice } from "@/components/level-two/levelTwo";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED } from "@/components/ui/raised";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { fireSceneTrigger } from "@/lib/rive/variableHost";
import { TipCard } from "@/components/sequence/HexScreen";
import { useBubbleSize } from "./bubbleWidth";
import { IDLE_LOOK, MAX_OPTION_WORDS, OPTION, parseTitle, type InteractionStage, type Option, type QuizStage, type ScreenDef } from "./quiz";
import { DRINK_HINT_STEPS, sceneOf, STEP, variableNext, variablePrevious, VARIABLE_STEPS, type SceneKind } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

/**
 * The answers' size, gap, padding, corners, text and rise are `OPTION` (see `quiz.ts`): one set for every option of
 * every screen, rows and cards alike, so the scene (about 306px from under Hex's bubble, 262 of it picture) has the
 * same room above them everywhere, both when a question is open (they end above the button) and after a check (it has
 * risen to the head and they have risen clear of the result panel).
 */

/** The least a picture is shrunk to fit its room. */
const MIN_FIT = 0.6;
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
const backdropFor = (scene: SceneKind, step: number, lifted: boolean) => {
  switch (scene) {
    case "bottleWallet":
      return <BottleWalletBackdrop lifted={lifted} />;
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

/** Four answers this short stand as two rows of two cards. */
const FOUR_ANSWER_CHARS = 18;
/**
 * A name longer than this (a variable such as `present_students`) may break after its underscores, so three of them
 * fit three cards across; a shorter one (`water_level`) stays whole and widens its card instead.
 */
const LONG_NAME_CHARS = 12;

const wordCount = (text: string) => text.trim().split(/\s+/).length;
/** `text` as set in a card: a long name gets a place to break after each underscore (a zero-width space). */
const cardText = (text: string) => (text.length > LONG_NAME_CHARS ? text.replace(/_/g, "_​") : text);

/**
 * Whether the answers are cards across rather than rows: objects to tap, three answers of at most `MAX_OPTION_WORDS`
 * words (mini cards in one row, with a picture above the words if they have one), or four short ones two by two.
 */
const acrossCards = (stage: QuizStage) =>
  stage.layout === "grid" ||
  (stage.options.length === 3 && stage.options.every((option) => wordCount(option.text) <= MAX_OPTION_WORDS)) ||
  (stage.options.length === 4 && stage.options.every((option) => !option.icon && !option.node && !option.emoji && option.text.length <= FOUR_ANSWER_CHARS));

const hasPictures = (options: readonly Option[]) => options.some((option) => option.node || option.emoji || option.icon);
const columnsFor = (count: number) => (count === 3 ? 3 : 2);

/** Rows of answers in words, or cards to tap: the height they take. */
const answersHeight = (stage: QuizStage) => {
  if (!acrossCards(stage)) return stage.options.length * OPTION.height + (stage.options.length - 1) * OPTION.gap;
  const rows = Math.ceil(stage.options.length / columnsFor(stage.options.length));
  return rows * (hasPictures(stage.options) ? OPTION.pictureHeight : OPTION.height) + (rows - 1) * OPTION.gap;
};

/**
 * The most the answers can take once a check has raised them (px): the room between the risen scene's bottom edge
 * (y 431 on a phone) and the result panel (y 600), with `GAP_BELOW_SCENE` kept clear at both ends: 145. Two rows, one
 * row of cards and two rows of word cards fit; three rows (196) do not.
 */
const ROOM_AFTER_CHECK = OPTION.panelTop - GAP_BELOW_SCENE - (SCENE_BOTTOM_LIFTED_PHONE + GAP_BELOW_SCENE);

const LETTERS = ["A", "B", "C", "D", "E"];

/** Cards to tap, side by side (three across, or two), in the place and the way the rows of answers stand. */
function ObjectGrid({
  options,
  correctId,
  selectedId,
  checked,
  fadeOut,
  pointedId,
  withHint,
  spill,
  onPick,
}: {
  options: readonly Option[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out (a right answer clears the screen). */
  fadeOut: boolean;
  /** The card the hint's hand is on (see `useAnswerHint`): it takes a tint and a shine. */
  pointedId: string | null;
  withHint: boolean;
  spill: boolean;
  onPick: (id: string) => void;
}) {
  const pictures = hasPictures(options);
  return (
    <motion.div
      initial={{ opacity: 0, y: 90 }}
      animate={{ opacity: fadeOut ? 0 : 1, y: checked ? -OPTION.rise : 0 }}
      transition={checked ? { y: PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : ANSWERS_IN}
      className="pointer-events-auto absolute z-[1] grid"
      // Equal columns, except that a card of words is never narrower than its words (`water_level` is wider than a third of the column at this size), so the text stays inside it.
      style={{ bottom: aboveButtons(OPTION.aboveButtons, withHint), left: COLUMN_LEFT, width: COLUMN_W, gap: OPTION.gap, gridTemplateColumns: `repeat(${columnsFor(options.length)}, minmax(${pictures ? "0px" : "min-content"}, 1fr))` }}
    >
      {options.map((option) => {
        const state = optionState(option.id, selectedId, checked, correctId);
        const pointed = pointedId === option.id && state === "idle";
        const spilling = spill && checked && state === "wrong";
        return (
          <div key={option.id} className="relative flex min-w-0">
            <motion.button
              type="button"
              data-hint={option.id}
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
              // The side padding makes up the border's width (a 1px line + the rest at rest, a 4px border + the rest picked: `OPTION.padX` either way), so a card is as wide picked as at rest and nothing around it moves.
              style={{ height: pictures ? OPTION.pictureHeight : OPTION.height, borderRadius: OPTION.radius, paddingInline: state === "idle" ? OPTION.padX - 1 : OPTION.padX - 4 }}
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-visible ${RAISED} ${LOOKS[state].edge} ${
                state === "idle" ? `border ${IDLE_LOOK}` : `border-4 ${LOOKS[state].card}`
              }`}
            >
              {pictures && (
                <span className="flex h-[54px] items-center justify-center text-[44px] leading-none">
                  {option.icon ? <img src={option.icon} alt="" width={58} height={54} draggable={false} className="h-[54px] w-auto select-none object-contain" /> : (option.node ?? option.emoji)}
                </span>
              )}
              {/* Two words stand on two lines when they do not fit on one (the card is 56px tall, two lines are 40). */}
              <span className="text-center leading-5 font-semibold text-[#444444] dark:text-white" style={{ fontSize: OPTION.font }}>
                {cardText(option.text)}
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
              <PointedLook pointed={pointed} />
            </motion.button>
          </div>
        );
      })}
    </motion.div>
  );
}

/** An interaction stage's own picture and controls. */
function InteractionHost({ stage, slip, done, finished, hint }: { stage: InteractionStage; slip: () => void; done: () => void; finished: boolean; hint: number }) {
  return <>{stage.render({ slip, done, finished, hint })}</>;
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
  // A question's hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  // How many times the hint button has been pressed on this stage: an interaction shows its own help for each press.
  const [hintPresses, setHintPresses] = useState(0);
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
  // Every question has the hint button; an interaction has it only if it says so.
  const hasHint = !!quiz || !!interaction?.hint;
  // What Hex says, and the bubble that holds it in two lines.
  const sayLine = quiz ? quiz.line : "";
  const bubble = useBubbleSize(sayLine);
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

  // The labelled bottles are shuffled when "Which bottle is mine?" opens, and again for each new try (on the reflection screen that brings them back they just stand there).
  useEffect(() => {
    if (sceneKind === "names" && screen.step === STEP.labels) fireSceneTrigger("names", "shuffle");
  }, [sceneKind, screen.step, attempt]);

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
    answerHint.stop();
    setChecked(true);
    record(right);
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  // The learner picks an answer: the hint's hand goes.
  const pick = (id: string) => {
    answerHint.stop();
    setSelectedId(id);
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
    answerHint.stop();
    setHintPresses(0);
    setAttempt(0);
    setFinished(false);
  };

  const onContinue = () => {
    if (!quiz) advance();
    else if (!checked) check();
    else if (right) advance();
    else tryAgain();
  };

  // A question's hint points at the right answer (it is not picked for the learner); an interaction shows its own help for each press.
  const useHint = () => {
    if (quiz) answerHint.press(quiz.correctId);
    else setHintPresses((previous) => previous + 1);
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
  const answersBottom = quiz ? aboveButtons(OPTION.aboveButtons, hasHint) : "0px";
  const bodyBottom = quiz ? `calc(${answersBottom} + ${answersHeight(quiz) + 18}px)` : aboveButtons(24);

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
            ? (quiz.ctaLabel ?? "Check")
            : right
              ? (quiz.nextLabel ?? "Next")
              : "Try again"
          : finished
            ? (interaction?.nextLabel ?? "Next")
            : (interaction?.ctaLabel ?? "Continue")
      }
      // A question's hint goes once it is checked; an interaction's goes once it is done.
      hint={hasHint ? { visible: quiz ? !checked : !finished, onUse: useHint } : undefined}
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
            style={{ top: titleEnd, bottom: bodyBottom, paddingBottom: checked ? OPTION.rise : 0 }}
          >
            <motion.div
              initial={false}
              animate={{ opacity: checked ? 0 : 1, height: checked ? 0 : "auto" }}
              transition={{ duration: 0.35 }}
              // Hex's bubble is lifted (see `HEX_LIFT`), clear of the picture's top; only it moves, what is under it stays where it was.
              style={{ overflow: checked ? "hidden" : "visible", top: longLine ? 0 : -HEX_LIFT }}
              // Only 4px in from the edges: Hex and a wide bubble (up to 272px, see `bubbleWidth`) need the room.
              className="relative flex w-full shrink-0 justify-center px-1"
            >
              {longLine ? (
                <div className="w-[340px]">
                  <TipCard>{quiz.line}</TipCard>
                </div>
              ) : (
                <HexBubble
                  key={`${stageIndex}-${attempt}`}
                  entryKey={`variable-${screen.step}-${stageIndex}-${attempt}`}
                  hex="left"
                  line={[{ text: quiz.line }]}
                  size={bubble}
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
              </motion.div>
            </div>
          </div>

          {acrossCards(quiz) ? (
            <ObjectGrid
              options={quiz.options}
              correctId={shownCorrectId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={cleared}
              pointedId={answerHint.pointedId}
              withHint={hasHint}
              spill={!!quiz.spill}
              onPick={pick}
            />
          ) : (
            <AnswerCards
              choices={choices}
              correctId={shownCorrectId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={cleared}
              pointedId={answerHint.pointedId}
              withHint={hasHint}
              rise={OPTION.rise}
              bottomGap={OPTION.aboveButtons}
              // Answers too tall for the room under the risen scene (three rows) fold away after a wrong check but for the picked one; a right answer clears them all anyway.
              onlyPicked={answersHeight(quiz) > ROOM_AFTER_CHECK && !cleared}
              compact
              tight={{ height: OPTION.height, padX: OPTION.padX, radius: OPTION.radius, iconSize: 40 }}
              idleLook={IDLE_LOOK}
              gap={OPTION.gap}
              fontSize={OPTION.font}
              onPick={pick}
            />
          )}
          {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
          {answerHint.hand}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ top: titleEnd, bottom: bodyBottom }}>
          {interaction && <InteractionHost stage={interaction} slip={slip} done={done} finished={finished} hint={hintPresses} />}
        </div>
      )}

      <Confetti active={celebrate || (finished && !!panel)} />
      <XpBurst show={celebrate || (finished && !!panel)} />
    </LevelTwoShell>
  );
}
