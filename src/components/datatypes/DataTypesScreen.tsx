"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle, SoftBackdrop, underAbove } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT, type BubbleSize } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { IDLE_LOOK, OPTION } from "@/components/variable/quiz";
import { COLUMN_W } from "@/lib/questionColumn";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireSceneTrigger, type SceneValues } from "@/lib/rive/datatypesHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { DATATYPES_STEPS, datatypesNext, datatypesPrevious } from "./datatypes";
import { noteAnswer, noteStruggle } from "./datatypesScore";
import { acrossCards, answersHeight, optionFont, OptionGrid, PictureGrid } from "./OptionCards";
import { HEX_LIFT, LARGE_SCENE, liftCss, SceneBackdrop, sceneHeight, sceneLift, sceneTop } from "./scenes";
import { parseTitle, type InteractionStage, type ScreenDef, type VisualContext } from "./screen";

/*
 * The answers (rows or cards) are the Variable module's: `OPTION` gives their size, gap, padding, corners, text and rise
 * (see `OptionCards.tsx`).
 */
/** How much room the result panel takes from an interaction's area once it is up. */
const PANEL_ROOM = 215;
/** The least a picture is shrunk to fit its room. */
const MIN_FIT = 0.6;
/** The answers' own way in, so a question standing on them comes in with them. */
const ANSWERS_IN = { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } } as const;
/** The title block (px): where it ends, one line or two. */
export const TITLE_END = { one: 125, two: 163 } as const;
/** How many letters of a question fit a line, for the room it takes. */
const QUESTION_CHARS = 36;
/** The result panel's height (px) with a text of three lines or fewer: its own least (`FeedbackPanel`'s `CENTRED_SHEET`), which `OPTION.rise` was worked out for. A longer text makes it taller, and the answers rise by as much. */
const PANEL_H = 236;
/** The room (px) kept between the risen answers and the result panel's top edge, on top of the 12 or so `OPTION.rise` already leaves. */
const ANSWERS_PANEL_GAP = 8;

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

/** The least room (px) kept between what hangs under a scene and the main button, on a screen too short to hold both in full: the same as a question's answers (`OPTION.aboveButtons`). */
const DOCK_GAP = OPTION.aboveButtons;
/** The room (px) kept between the scene's bottom edge and an interaction hanging under it. */
const SCENE_GAP = 4;
/**
 * The height (px) an interaction under a scene is counted as at least when it is worked out how much room the scene may keep: the tallest of the
 * tap-the-buttons stages (two rows of 60px buttons and the caption's room, screen 12). So on a short screen the scene is cut to the same height on
 * every one of them (11, 12, 15, 16, 17), and their buttons start at the same line, not by how much each stage happens to hold.
 */
const DOCK_MIN_H = 186;
/** The room (px) kept between the scene and a question's answers once they have risen above the result panel. */
const ANSWERS_SCENE_GAP = 12;
/** The least height (px) the scene is ever cut to. */
const SCENE_MIN_H = 160;

/**
 * What an interaction draws under a scene. It hangs `SCENE_GAP` under the scene's bottom edge, as a question's answers do, and fades
 * once its result panel is up. It never goes under the main button or over the scene: the room above it is a spacer as tall as the scene
 * that gives way where the screen is too short (the stage then stands `DOCK_GAP` above the button), and it tells the screen how tall it is,
 * so the scene is cut to the room it leaves (see `SceneBackdrop`). It rises with the scene when that rises into Hex's room, so the space
 * between them stays. `rise` (px): its lowest place is this much higher, clear of the result panel (a stage that is kept, see
 * `InteractionStage.keepOptions`).
 */
function UnderScene({ titleEnd, lifted, hidden, rise, onHeight, children }: { titleEnd: number; lifted: boolean; hidden: boolean; rise: number; onHeight: (height: number) => void; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const measure = () => onHeight(element.offsetHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      observer.disconnect();
      onHeight(0);
    };
  }, [onHeight]);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col" style={{ bottom: `calc(${aboveButtons(DOCK_GAP)} + ${rise}px)`, transition: liftCss("bottom", lifted) }}>
      <div
        aria-hidden
        className="min-h-0 shrink"
        style={{ height: `calc(${sceneTop(titleEnd) - (lifted ? sceneLift(titleEnd) : 0) + SCENE_GAP}px + ${sceneHeight})`, transition: liftCss("height", lifted) }}
      />
      <div className="shrink-0" style={{ minHeight: rise > 0 ? 0 : DOCK_MIN_H }}>
        <motion.div ref={content} initial={false} animate={{ opacity: hidden ? 0 : 1 }} transition={{ duration: 0.3 }} className="flex justify-center" style={{ pointerEvents: hidden ? "none" : "auto" }}>
          {children}
        </motion.div>
      </div>
    </div>
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
  // A question's hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
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
  // How tall the stage standing on the main button is (px), 0 while there is none: the scene is cut to the room it leaves.
  const [dockHeight, setDockHeight] = useState(0);
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
  // How tall the result panel is right now (px): its text decides (three lines or fewer is `PANEL_H`, a fourth makes it 20 taller). The answers rise above it, never against it.
  const [panelHeight, setPanelHeight] = useState(PANEL_H);
  const overlayRef = useCallback((element: HTMLDivElement | null) => {
    const sheet = element?.firstElementChild;
    if (!(sheet instanceof HTMLElement)) return;
    const observer = new ResizeObserver(() => setPanelHeight(sheet.offsetHeight));
    observer.observe(sheet);
    setPanelHeight(sheet.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const stage = screen.stages[stageIndex];
  const lastStage = stageIndex === screen.stages.length - 1;
  const quiz = stage.kind === "quiz" ? stage : null;
  const interaction = stage.kind === "interaction" ? stage : null;
  const correct = !!quiz && selectedId === quiz.correctId;
  // Every question has the hint button.
  const hasHint = !!quiz;
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
    answerHint.stop();
    setChecked(true);
    record(correct);
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
      router.push(datatypesNext(screen.step));
      return;
    }
    setStageIndex((previous) => previous + 1);
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    answerHint.stop();
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

  // The hint points at the right answer; it is not picked for the learner.
  const useHint = () => {
    if (quiz) answerHint.press(quiz.correctId);
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

  // Hex's line for this stage.
  const line = quiz ? quiz.line : (interaction?.line ?? null);
  // Hex's line goes, the scene rises into his room and what stands under it rises with it, to make room for a result panel. A stage that has none (an interaction with no `finishPanel`) has nothing to make room for: finishing it moves nothing, so its options stay where they were.
  const gone = quiz ? checked : (finished && !!interaction?.finishPanel) || hexDismissed;
  const bubbleWidth = interaction?.bubbleWidth ?? quiz?.bubbleWidth;

  // What stands under the line: the picture, the question and the answers (question stage), or the interaction.
  const answersBottom = quiz ? aboveButtons(OPTION.aboveButtons, hasHint) : "0px";
  const questionLines = quiz?.question ? Math.ceil(quiz.question.length / QUESTION_CHARS) : 0;
  const questionHeight = questionLines ? questionLines * 22 + 14 : 0;
  // The answers' own height: a column of rows (`layout: "rows"`) or picture cards (`"pictures"`) if the screen sets them so, else cards or rows by their words.
  const answersAsRows = quiz?.layout === "rows";
  const answersAsPictures = quiz?.layout === "pictures";
  const answersTall = quiz ? answersHeight(quiz.options, false, quiz.layout) : 0;
  // The room a question takes between what is above and its answers (its box and the space under it), 0 without one.
  const questionRoom = questionHeight ? questionHeight + 8 : 0;
  const bodyBottom = quiz ? `calc(${answersBottom} + ${answersTall + 10 + questionHeight + 8}px)` : aboveButtons(24);
  // The answers never go away on a check, right or wrong: they rise above the panel (the scene has risen clear of them), and on a right one the right card bounces.
  // They stand clear of the panel's top edge whatever its height (`ANSWERS_PANEL_GAP`, and the lines its text has taken beyond three).
  const answersRise = OPTION.rise + ANSWERS_PANEL_GAP + Math.max(0, panelHeight - PANEL_H);
  // Once the result panel is up, the answers rise and the room under the line shrinks by as much.
  const risen = quiz ? answersRise : interaction?.finishPanel ? PANEL_ROOM : 0;

  // What hangs under a scene stands right under it. The scene fills the device's width, so on a short, wide screen it is taller than the room the buttons leave it:
  // it is then cut there (at its floor) instead of their standing over it, for an interaction and for a question's answers (once checked, for where they stand clear of the result panel).
  const docked = !!scene && !!interaction?.render;
  // A kept stage (`keepOptions`) stands clear of the result panel once it is up, as a question's answers do, and the scene (risen too) is cut above it.
  const keptRise = docked && !!panel && !!interaction?.keepOptions ? answersRise : 0;
  const sceneMaxHeight = docked
    ? keptRise > 0
      ? `max(${SCENE_MIN_H}px, calc(100% - ${sceneTop(titleEnd)}px - ${aboveButtons(DOCK_GAP)} - ${dockHeight + keptRise + ANSWERS_SCENE_GAP - sceneLift(titleEnd)}px))`
      : // A risen scene has that much more room above the stage, so it is cut that much less.
        `max(${SCENE_MIN_H}px, calc(100% - ${sceneTop(titleEnd)}px - ${aboveButtons(DOCK_GAP)} - ${Math.max(dockHeight, DOCK_MIN_H) + SCENE_GAP - (gone ? sceneLift(titleEnd) : 0)}px))`
    : scene && quiz
      ? `max(${SCENE_MIN_H}px, calc(100% - ${sceneTop(titleEnd)}px - ${answersBottom} - ${questionRoom + answersTall + ANSWERS_SCENE_GAP + (gone ? answersRise - sceneLift(titleEnd) : 0)}px))`
      : undefined;
  // Where a question's answers hang: right under the scene's bottom edge (`ANSWERS_SCENE_GAP` clear of it); on a screen with no scene, under Hex's bubble; with no bubble either (it has left), under the title.
  // The question, if there is one, comes between. They are never lower than the button row allows (`underAbove`), so a tall phone's spare room is above the button.
  // Checked, the scene has risen (`gone`) and they rise with it, but never so low that the result panel covers them.
  const above = scene
    ? `calc(${sceneTop(titleEnd) - (gone ? sceneLift(titleEnd) : 0)}px + ${sceneHeight})`
    : `${line && !gone ? sceneTop(titleEnd) + HEX_LIFT : titleEnd}px`;
  const hangingTop = underAbove(`calc(${above} + ${ANSWERS_SCENE_GAP + questionRoom}px)`, answersTall, OPTION.aboveButtons, hasHint);
  // A picture that is not a scene stands in the middle of the room: its answers stay on the button row, clear of it.
  const standingTop = `calc(var(--stage-h, 844px) - ${answersBottom} - ${answersTall}px)`;
  const restingTop = quiz?.visual && !scene ? standingTop : hangingTop;
  const answersTop = gone ? `min(${restingTop}, calc(${standingTop} - ${answersRise}px))` : restingTop;
  const answersMove = liftCss("top", gone);

  return (
    <LevelTwoShell
      step={screen.step}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(screen.step))}
      scene={
        <>
          <SoftBackdrop />
          {scene && <SceneBackdrop scene={scene.scene} values={scene.values} texts={scene.texts} intro={scene.intro} titleEnd={titleEnd} lifted={gone} scale={lookOnly ? (scene.lookScale ?? LARGE_SCENE) : 1} maxHeight={sceneMaxHeight} cutMove={liftCss("max-height", gone)} />}
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
      // Answers that wait for Hex's line come in after it: the hand has nothing to point at before then.
      hint={hasHint ? { visible: !checked, onUse: useHint, disabled: !!quiz?.optionsAfterHex && !hexSpoken } : undefined}
      onContinue={onContinue}
      overlay={
        <div ref={overlayRef} className="pointer-events-none absolute inset-0">
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

      {/* An interaction under a scene hangs right under it (see `UnderScene`), and fades once its result panel is up. Whenever the scene rises into Hex's room (his line sent away, or the stage done: see `SceneBackdrop`) it rises with it, so the space between them stays. */}
      {scene && interaction && (
        <UnderScene titleEnd={titleEnd} lifted={gone} hidden={!!panel && !interaction.keepOptions} rise={keptRise} onHeight={setDockHeight}>
          <InteractionHost key={stageIndex} stage={interaction} slip={slip} done={done} dismissHex={dismissHex} finished={finished} hexSpoken={hexSpoken} takeContinue={takeContinue} setScene={setScene} />
        </UnderScene>
      )}

      {quiz && (
        <>
          {quiz.question && (
            <motion.p
              initial={{ opacity: 0, y: 90 }}
              animate={{ opacity: 1, y: 0 }}
              transition={ANSWERS_IN}
              className="absolute z-[1] rounded-[12px] bg-white/85 px-3 py-1.5 text-center text-[16px] leading-[22px] font-semibold text-[#444444] dark:bg-[#15181E]/85 dark:text-white"
              style={{ top: `calc(${answersTop} - ${questionRoom}px)`, transition: answersMove, left: COLUMN_LEFT, width: COLUMN_W }}
            >
              {quiz.question}
            </motion.p>
          )}
          {answersAsPictures ? (
            <PictureGrid
              options={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              pointedId={answerHint.pointedId}
              top={answersTop}
              move={answersMove}
              bounceIn={quiz.optionsAfterHex}
              revealed={hexSpoken}
              onPick={pick}
            />
          ) : !answersAsRows && acrossCards(quiz.options) ? (
            <OptionGrid
              options={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={false}
              pointedId={answerHint.pointedId}
              withHint={hasHint}
              rise={0}
              top={answersTop}
              move={answersMove}
              bounceIn={quiz.optionsAfterHex}
              revealed={hexSpoken}
              onPick={pick}
            />
          ) : (
            <AnswerCards
              choices={quiz.options}
              correctId={checked && !correct ? "" : quiz.correctId}
              selectedId={selectedId}
              checked={checked}
              fadeOut={false}
              pointedId={answerHint.pointedId}
              withHint={hasHint}
              rise={0}
              top={answersTop}
              move={answersMove}
              compact
              tight={{ height: OPTION.height, padX: OPTION.padX, radius: OPTION.radius, iconSize: 40 }}
              idleLook={IDLE_LOOK}
              gap={OPTION.gap}
              fontSize={Math.min(...quiz.options.map((option) => optionFont(option.text)))}
              bounceIn={quiz.optionsAfterHex}
              revealed={hexSpoken}
              bounceRight
              onPick={pick}
            />
          )}
          {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
          {answerHint.hand}
        </>
      )}
    </LevelTwoShell>
  );
}
