"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT, type BubbleSize } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { IDLE_LOOK, OPTION } from "@/components/variable/quiz";
import { COLUMN_W } from "@/lib/questionColumn";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireSceneTrigger, type SceneValues } from "@/lib/rive/datatypesHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { DATATYPES_STEPS, datatypesNext, datatypesPrevious } from "./datatypes";
import { noteAnswer, noteStruggle } from "./datatypesScore";
import { acrossCards, answersHeight, OptionGrid } from "./OptionCards";
import { HEX_LIFT, LARGE_SCENE, LIFT_DOWN, LIFT_UP, SceneBackdrop, sceneHeight, sceneLift, sceneTop } from "./scenes";
import { parseTitle, type InteractionStage, type ScreenDef, type VisualContext } from "./screen";

/*
 * The answers (rows or cards) are the Variable module's: `OPTION` gives their size, gap, padding, corners, text and rise
 * (see `OptionCards.tsx`).
 */
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

/** Hex's bubble: 190 wide holds two lines of up to about 30 letters (a long word wraps early); a longer line takes the widest the row has room for (about 248), two lines of up to about 46. */
const bubbleSize = (line: string): BubbleSize => ({ width: line.length <= 30 ? 190 : 248 });

/** An interaction stage's own picture and controls. */
function InteractionHost({
  stage,
  slip,
  done,
  dismissHex,
  finished,
  hexSpoken,
  takeContinue,
  setScene,
}: {
  stage: InteractionStage;
  slip: () => void;
  done: () => void;
  dismissHex: () => void;
  finished: boolean;
  hexSpoken: boolean;
  takeContinue: (handler: (() => boolean) | null) => void;
  setScene: (values: SceneValues) => void;
}) {
  return <>{stage.render?.({ slip, done, dismissHex, finished, hexSpoken, takeContinue, setScene })}</>;
}

/** The least room (px) kept between what stands under a scene and the main button's top edge. */
const BUTTON_CLEAR = 6;

/**
 * What an interaction draws under a scene: it stands right below the scene, and rises with it when it sends Hex's line
 * away. Where the stage leaves it too little room (a wide window makes the main button taller), it stands higher instead,
 * over the scene's faded floor, so none of it is ever under the main button.
 */
function UnderScene({ titleEnd, lifted, hidden, children }: { titleEnd: number; lifted: boolean; hidden: boolean; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  // How far (px) it has to stand higher.
  const [over, setOver] = useState(0);
  // Once Hex's line has gone the whole box stands this much higher already (the scene rose into his room), so it needs no more room.
  const lift = lifted ? sceneLift(titleEnd) : 0;
  useLayoutEffect(() => {
    const element = box.current;
    const inner = content.current;
    const line = edge.current;
    const stage = element?.offsetParent;
    if (!element || !inner || !line || !stage) return;
    // Layout px of the stage, which the box's own move (the transform) does not change: its bottom (where it stands, as tall as what it holds, less the lift) against the line that stands `BUTTON_CLEAR` above the button.
    const measure = () => setOver(Math.max(0, element.offsetTop + inner.offsetHeight - lift - line.offsetTop));
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    observer.observe(stage);
    measure();
    return () => observer.disconnect();
  }, [lift]);
  return (
    <>
      <motion.div
        ref={box}
        initial={false}
        // The lift and the extra room it needs are one move (not two that could pull against each other), so it never jumps.
        animate={{ y: -(lift + over) }}
        transition={lifted ? LIFT_UP : LIFT_DOWN}
        className="absolute inset-x-0"
        style={{ top: `calc(${sceneTop(titleEnd)}px + ${sceneHeight} + 4px)` }}
      >
        <motion.div ref={content} initial={false} animate={{ opacity: hidden ? 0 : 1 }} transition={{ duration: 0.3 }} className="flex justify-center" style={{ pointerEvents: hidden ? "none" : "auto" }}>
          {children}
        </motion.div>
      </motion.div>
      <div ref={edge} aria-hidden className="pointer-events-none absolute inset-x-0" style={{ bottom: aboveButtons(BUTTON_CLEAR), height: 0 }} />
    </>
  );
}

/**
 * A Data Types screen, in the Sequence and Command modules' design: the
 * headline, Hex's short line, a picture, and the answers (rows with a picture,
 * or tiles). Continue checks the pick and the result panel (with Hex) slides
 * up; a right answer goes on and a wrong one is tried again, with the right one
 * never shown. A screen can have several stages (an interaction, then a
 * question, or two questions). An interaction stage is something to do (tap,
 * sort, match) that unlocks Continue when it is done. Going on from the last
 * stage follows the module's flow (skips and detours).
 */
export function DataTypesScreen({ screen }: { screen: ScreenDef }) {
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
  // Hex has said his line (the answers of a stage that waits for him come in then).
  const [hexSpoken, setHexSpoken] = useState(false);
  // An interaction has sent Hex's line away early, to talk through its own Hex lower down.
  const [hexDismissed, setHexDismissed] = useState(false);
  // What the interaction has changed in its scene so far (see `InteractionApi.setScene`); each stage starts clean.
  const [sceneExtra, setSceneExtra] = useState<SceneValues>({});
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
  // A look-only stage can be gone on from once Hex has said all of his line (at once, if he has none, or if he has been sent away).
  const lookReady = !!interaction?.ready && (hexSpoken || hexDismissed || !interaction.line);

  // The scene behind the stage, if it has one: its data follows what the learner has done (an interaction is "checked" and "correct" once it is finished),
  // and an interaction can add to it as it goes (a card sent to its bin).
  const sceneContext: VisualContext = { attempt, picked: selectedId, checked: quiz ? checked : finished, correct: quiz ? correct : finished, hexSpoken };
  const stageScene = !stage.scene ? null : typeof stage.scene === "function" ? stage.scene(sceneContext) : stage.scene;
  const scene = stageScene && { ...stageScene, values: { ...stageScene.values, ...sceneExtra } };
  // A look-only stage (a scene, and nothing under it to tap or pick) draws its scene larger, the same for all of them.
  const lookOnly = !!scene && !!interaction && !interaction.render;

  const record = (clean: boolean) => {
    noteAnswer(screen.step, stageIndex, clean);
    if (!clean) noteStruggle(screen.step, "miss");
    vibrateForAnswer(clean);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: clean }));
    if (scene && (clean || scene.markWrong !== false)) fireSceneTrigger(scene.scene, clean ? "correct" : "wrong");
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
  const dismissHex = useCallback(() => setHexDismissed(true), []);
  const setScene = useCallback((values: SceneValues) => setSceneExtra(values), []);
  // A stage that steps through its own parts can take Continue over (see `InteractionApi.takeContinue`).
  const continueHandler = useRef<(() => boolean) | null>(null);
  const takeContinue = useCallback((handler: (() => boolean) | null) => {
    continueHandler.current = handler;
  }, []);

  const check = () => {
    setChecked(true);
    record(correct);
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const advance = () => {
    if (lastStage) {
      router.push(datatypesNext(screen.step));
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
    setSceneExtra({});
  };

  const onContinue = () => {
    if (!quiz) {
      // A stage that steps through its own parts uses the press until it has shown them all.
      if (!continueHandler.current?.()) advance();
    } else if (!checked) check();
    else if (correct) advance();
    else tryAgain();
  };

  const useHint = () => {
    setHinted(true);
    noteStruggle(screen.step, "hint");
  };

  // A stage can be headed differently from its screen (and then sets its own title size).
  const ownTitle = stage.title !== undefined;
  const title = parseTitle(stage.title ?? screen.title);
  // A screen can set its title's size: it is then on one line, as the design has it.
  const setSize = ownTitle ? stage.titleSize : screen.titleSize;
  const titleLines = setSize === undefined && title.twoLines;
  const titleSize = setSize ?? title.size;
  const titleEnd = titleLines ? TITLE_END.two : TITLE_END.one;
  const panel = quiz
    ? checked
      ? { right: correct, title: correct ? quiz.rightTitle : (quiz.wrongTitle ?? "Not quite"), text: correct ? quiz.right : quiz.wrong }
      : null
    : finished && interaction?.finishPanel
      ? { right: true, title: interaction.finishPanel.title, text: interaction.finishPanel.text }
      : null;

  // Hex's line for this stage (the hint replaces it).
  const line =quiz ? (hinted && quiz.hintText ? quiz.hintText : quiz.line) : (interaction?.line ?? null);
  const gone = quiz ? checked : finished || hexDismissed;
  const bubbleWidth = interaction?.bubbleWidth ?? quiz?.bubbleWidth;

  // What stands under the line: the picture, the question and the answers (question stage), or the interaction.
  const answersBottom = quiz ? aboveButtons(OPTION.aboveButtons, hasHint) : "0px";
  const questionLines = quiz?.question ? Math.ceil(quiz.question.length / QUESTION_CHARS) : 0;
  const questionHeight = questionLines ? questionLines * 22 + 14 : 0;
  const bodyBottom = quiz ? `calc(${answersBottom} + ${answersHeight(quiz.options) + 10 + questionHeight + 8}px)` : aboveButtons(24);
  // Once the result panel is up, the answers rise and the room under the line shrinks by as much.
  const risen = quiz ? OPTION.rise : interaction?.finishPanel ? PANEL_ROOM : 0;
  // A right answer stays: the answers rise above the panel (the scene has risen clear of them) and the right one bounces.
  // Under a scene a wrong one clears them instead (the scene shows what was picked), and they leave from where they stand.
  const answersAway = !!quiz && checked && !correct && !!scene;
  const answersRise = answersAway ? 0 : OPTION.rise;

  return (
    <LevelTwoShell
      step={screen.step}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(screen.step))}
      scene={
        <>
          <SoftBackdrop />
          {scene && <SceneBackdrop scene={scene.scene} values={scene.values} titleEnd={titleEnd} lifted={gone} scale={lookOnly ? LARGE_SCENE : 1} />}
          {screen.backdrop}
        </>
      }
      answer={answer}
      ctaDisabled={quiz ? selectedId === null : !finished && !lookReady}
      ctaLabel={
        quiz
          ? !checked
            ? (quiz.ctaLabel ?? "Check")
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
      <ScreenTitle key={ownTitle ? `${screen.step}-${stageIndex}` : screen.step} oneLine={!titleLines}>
        <span style={{ fontSize: titleSize }}>
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
        style={{ top: scene ? titleEnd - HEX_LIFT : titleEnd, bottom: bodyBottom, paddingBottom: gone ? risen : 0 }}
      >
        {line && (
          <motion.div
            initial={false}
            animate={{ opacity: gone ? 0 : 1, height: gone ? 0 : "auto" }}
            transition={{ duration: 0.35 }}
            style={{ overflow: gone ? "hidden" : "visible" }}
            className="flex w-full shrink-0 justify-center px-4"
          >
            <HexBubble
              key={`${stageIndex}-${attempt}`}
              entryKey={`datatypes-${screen.step}-${stageIndex}-${attempt}`}
              hex="left"
              line={[{ text: line }]}
              size={bubbleWidth ? { width: bubbleWidth } : bubbleSize(line)}
              leaving={gone}
              onSpoken={() => setHexSpoken(true)}
            />
          </motion.div>
        )}
        {!scene && (
          <div ref={roomRef} className={`flex min-h-0 w-full flex-1 flex-col items-center ${interaction?.alignTop ? "justify-start" : "justify-center"}`}>
            <div ref={pictureRef} className="flex flex-col items-center gap-2 transition-transform duration-300 ease-out" style={{ transform: `scale(${fit})`, transformOrigin: interaction?.alignTop ? "top center" : "center" }}>
              {quiz
                ? quiz.visual?.({ attempt, picked: selectedId, checked, correct, hexSpoken })
                : interaction && <InteractionHost key={stageIndex} stage={interaction} slip={slip} done={done} dismissHex={dismissHex} finished={finished} hexSpoken={hexSpoken} takeContinue={takeContinue} setScene={setScene} />}
            </div>
          </div>
        )}
      </div>

      {/* An interaction under a scene stands below it and leaves once it is done. When it sends Hex's line above away the scene rises into his room (see `SceneBackdrop`), and the interaction rises with it, so it stays right under the scene. */}
      {scene && interaction && (
        <UnderScene titleEnd={titleEnd} lifted={hexDismissed} hidden={!!panel}>
          <InteractionHost key={stageIndex} stage={interaction} slip={slip} done={done} dismissHex={dismissHex} finished={finished} hexSpoken={hexSpoken} takeContinue={takeContinue} setScene={setScene} />
        </UnderScene>
      )}

      {quiz && (
        <>
          {quiz.question && (
            <motion.p
              initial={{ opacity: 0, y: 90 }}
              animate={{ opacity: answersAway ? 0 : 1, y: checked ? -answersRise : 0 }}
              transition={checked ? { ...PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : ANSWERS_IN}
              className="absolute z-[1] rounded-[12px] bg-white/85 px-3 py-1.5 text-center text-[16px] leading-[22px] font-semibold text-[#444444] dark:bg-[#15181E]/85 dark:text-white"
              style={{ bottom: `calc(${answersBottom} + ${answersHeight(quiz.options) + 10}px)`, left: COLUMN_LEFT, width: COLUMN_W }}
            >
              {quiz.question}
            </motion.p>
          )}
          {acrossCards(quiz.options) ? (
            <OptionGrid
              options={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={answersAway}
              hinted={hinted}
              withHint={hasHint}
              rise={answersRise}
              bounceIn={quiz.optionsAfterHex}
              revealed={hexSpoken}
              onPick={setSelectedId}
            />
          ) : (
            <AnswerCards
              choices={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={answersAway}
              hinted={hinted}
              withHint={hasHint}
              rise={answersRise}
              bottomGap={OPTION.aboveButtons}
              compact
              tight={{ height: OPTION.height, padX: OPTION.padX, radius: OPTION.radius, iconSize: 40 }}
              idleLook={IDLE_LOOK}
              gap={OPTION.gap}
              fontSize={OPTION.font}
              bounceIn={quiz.optionsAfterHex}
              revealed={hexSpoken}
              bounceRight
              onPick={setSelectedId}
            />
          )}
        </>
      )}
    </LevelTwoShell>
  );
}
