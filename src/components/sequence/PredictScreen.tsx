"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Teal } from "@/components/level-two/LevelTwoShell";
import { TileCards } from "@/components/level-two/TileCards";
import type { Choice } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HexBoard } from "./HexBoard";
import { CommandChips, HexScreen } from "./HexScreen";
import { endOf, GRID, GRID_START, tileName, trace, type Command, type Dir } from "./hexGrid";
import { IMAGES, STEP, sequenceNext } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";
import { useHexRun } from "./useHexRun";

export type PredictVariant = "base" | "longer" | "simpler";

type Config = {
  step: number;
  title: ReactNode;
  commands: readonly Command[];
  /** The tiles offered, in order; one is where Hex ends up. */
  options: readonly string[];
  right: { title: string; text: string };
  wrong: string;
};

const CONFIG: Record<PredictVariant, Config> = {
  base: {
    step: STEP.predict,
    title: (
      <>
        Think before you <Teal>move!</Teal>
      </>
    ),
    commands: ["right", "forward"],
    options: ["Centre-left", "Bottom-middle", "Bottom-right"],
    right: { title: "Good!", text: "The turn changed which way HEX faces." },
    wrong: "Watch which way HEX faces after the turn.",
  },
  // After a right first try: a longer sequence.
  longer: {
    step: STEP.predictNext,
    title: (
      <>
        A longer <Teal>sequence!</Teal>
      </>
    ),
    commands: ["forward", "right", "forward", "forward"],
    options: ["Centre", "Top-right", "Centre-right"],
    right: { title: "Great!", text: "You followed every command, turns included." },
    wrong: "Follow one command at a time. Which way does HEX face?",
  },
  // After a miss or a hint: a simpler two-command one.
  simpler: {
    step: STEP.predictNext,
    title: (
      <>
        Let’s try a <Teal>simpler one.</Teal>
      </>
    ),
    commands: ["forward", "forward"],
    options: ["Top-left", "Centre-left", "Top-right"],
    right: { title: "That’s it!", text: "Each MOVE FORWARD takes HEX one tile." },
    wrong: "Each MOVE FORWARD is one tile up. Count them.",
  },
};

const BOARD_WIDTH = 320;
const BOARD_TOP = 138;
const CHIPS_TOP = 350;
/** The answers wear the tint of the Hex Order cards, with the same border in dark. */
const OPTION_TINT = "bg-[#EDFAFE] dark:bg-[#15233A] dark:border-[#818185]!";
/** The question stands under the command cards. */
const QUESTION_TOP = CHIPS_TOP + 92;
/** A beat before the hint picks the right answer for the learner. */
const HINT_READ_MS = 600;
const ORANGE = "#FF8D42";
const TEAL = "#04ACAB";

/**
 * "Think before you move!": the commands are shown, and the learner picks where
 * Hex will end up, before he moves. Checking plays the commands on the board.
 * A wrong pick draws the way Hex faced at the start and after the turn. The hint
 * button picks the right answer for the learner.
 */
export function PredictScreen({ variant }: { variant: PredictVariant }) {
  const router = useRouter();
  const config = CONFIG[variant];
  const { hex, play, reset } = useHexRun(GRID_START, GRID);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  const hintTimer = useRef<number | undefined>(undefined);
  const stopHintTimer = () => window.clearTimeout(hintTimer.current);
  useEffect(() => stopHintTimer, []);

  const correctId = useMemo(() => tileName(endOf(GRID_START, config.commands, GRID)), [config.commands]);
  const choices: readonly Choice[] = config.options.map((name) => ({ id: name, text: name, icon: `${IMAGES}/icon-tile-${name.toLowerCase()}.svg`, tint: OPTION_TINT }));
  const correct = selectedId === correctId;
  // The way he faces to begin with, and after his first turn (if there is one).
  const ghostDirs = useMemo(() => {
    const turned = trace(GRID_START, config.commands, GRID).find((state) => state.dir !== GRID_START.dir)?.dir;
    const dirs: { dir: Dir; colour: string }[] = [{ dir: GRID_START.dir, colour: ORANGE }];
    if (turned !== undefined) dirs.push({ dir: turned, colour: TEAL });
    return dirs;
  }, [config.commands]);

  const useHint = () => {
    setHinted(true);
    noteStruggle(config.step, "hint");
    stopHintTimer();
    hintTimer.current = window.setTimeout(() => setSelectedId(correctId), HINT_READ_MS);
  };

  // The learner's own pick stands: the hint doesn't overwrite it when its wait runs out.
  const pick = (id: string) => {
    stopHintTimer();
    setSelectedId(id);
  };

  const check = () => {
    stopHintTimer();
    setChecked(true);
    noteFirstTry(config.step, correct);
    if (!correct) noteStruggle(config.step, "miss");
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    play(config.commands);
  };

  const tryAgain = () => {
    reset();
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setHinted(false);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(config.step));
    else tryAgain();
  };

  return (
    <HexScreen
      step={config.step}
      title={config.title}
      board={
        <HexBoard
          kind="grid"
          hex={hex}
          ghost={checked && !correct ? { at: GRID_START, dirs: ghostDirs } : null}
          width={BOARD_WIDTH}
          entryKey={`hex-predict-${variant}`}
        />
      }
      boardTop={BOARD_TOP}
      panel={{
        correct,
        title: correct ? config.right.title : "Not quite",
        text: correct ? config.right.text : config.wrong,
        open: checked,
      }}
      celebrate={checked && correct}
      answer={answer}
      hint={{ visible: !checked && !hinted, onUse: useHint }}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
      ctaDisabled={selectedId === null}
      onContinue={onContinue}
    >
      <div className="absolute inset-x-0 flex justify-center px-4" style={{ top: CHIPS_TOP }}>
        <CommandChips commands={config.commands} />
      </div>
      {!checked && (
        <p
          className="absolute left-1/2 w-[340px] -translate-x-1/2 rounded-[12px] bg-white px-3.5 py-3 text-center text-[14px] leading-5 font-semibold text-[#444444] shadow-[1px_1px_6px_rgba(0,0,0,0.12)] dark:bg-[#15181E] dark:text-white"
          style={{ top: QUESTION_TOP }}
        >
          Where will HEX end up?
        </p>
      )}
      <TileCards
        layout="tiles"
        choices={choices}
        correctId={checked && !correct ? "" : correctId}
        selectedId={selectedId}
        checked={checked}
        fadeOut={false}
        hinted={false}
        withHint
        longText
        onPick={pick}
      />
    </HexScreen>
  );
}
