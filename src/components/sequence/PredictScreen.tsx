"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnswerCards } from "@/components/level-two/AnswerCards";
import { Teal } from "@/components/level-two/LevelTwoShell";
import type { Choice } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HexBoard } from "./HexBoard";
import { CommandChips, HexScreen } from "./HexScreen";
import { endOf, GRID, GRID_START, tileName, trace, type Command, type Dir } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";
import { useHexRun } from "./useHexRun";

export type PredictVariant = "base" | "longer" | "simpler";

type Config = {
  step: number;
  title: ReactNode;
  commands: readonly Command[];
  /** The tiles offered, in order; one is where Hex ends up. */
  options: readonly string[];
  hint: string;
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
    hint: "After turning right, which direction will MOVE FORWARD take HEX?",
    right: { title: "Good prediction!", text: "You thought about how the first command changed HEX’s direction." },
    wrong: "Look at how the turn changed the way HEX faces.",
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
    hint: "Follow the commands one at a time. Which way is HEX facing after each one?",
    right: { title: "Great prediction!", text: "You followed every command in order, turns included." },
    wrong: "Follow the commands one at a time and watch which way HEX faces.",
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
    hint: "Each MOVE FORWARD takes HEX one tile in the direction he faces. Count the tiles.",
    right: { title: "That’s it!", text: "Each MOVE FORWARD took HEX one tile in the direction he faces." },
    wrong: "Each MOVE FORWARD takes HEX one tile up. Count the tiles.",
  },
};

/** The result panel makes room by raising the answers this far (px), as on the quiz screens. */
const LIST_RISE = 150;
const BOARD_WIDTH = 260;
const BOARD_TOP = 130;
const CHIPS_TOP = 330;
const LETTERS = ["A", "B", "C"];
const ORANGE = "#FF8D42";
const TEAL = "#04ACAB";

/**
 * "Think before you move!": the commands are shown, and the learner picks where
 * Hex will end up, before he moves. Checking plays the commands on the board.
 * A wrong pick draws the way Hex faced at the start and after the turn.
 */
export function PredictScreen({ variant }: { variant: PredictVariant }) {
  const router = useRouter();
  const config = CONFIG[variant];
  const { hex, play, reset } = useHexRun(GRID_START, GRID);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);

  const correctId = useMemo(() => tileName(endOf(GRID_START, config.commands, GRID)), [config.commands]);
  const choices: readonly Choice[] = config.options.map((name, index) => ({ id: name, text: name, icon: "", badge: LETTERS[index] }));
  const correct = selectedId === correctId;
  // The way he faces to begin with, and after his first turn (if there is one).
  const ghostDirs = useMemo(() => {
    const turned = trace(GRID_START, config.commands, GRID).find((state) => state.dir !== GRID_START.dir)?.dir;
    const dirs: { dir: Dir; colour: string }[] = [{ dir: GRID_START.dir, colour: ORANGE }];
    if (turned !== undefined) dirs.push({ dir: turned, colour: TEAL });
    return dirs;
  }, [config.commands]);

  const check = () => {
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
      tip={checked ? undefined : hinted ? config.hint : "Where will HEX end up?"}
      tipTop={CHIPS_TOP + (config.commands.length > 3 ? 70 : 38)}
      panel={{
        correct,
        title: correct ? config.right.title : "Not quite",
        text: correct ? config.right.text : config.wrong,
        open: checked,
      }}
      celebrate={checked && correct}
      answer={answer}
      hint={{
        visible: !checked,
        onUse: () => {
          setHinted(true);
          noteStruggle(config.step, "hint");
        },
      }}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
      ctaDisabled={selectedId === null}
      onContinue={onContinue}
    >
      {/* The raised answers stand over them once checked: the board shows the commands by then. */}
      <div className={`absolute inset-x-0 flex justify-center px-4 transition-opacity duration-300 ${checked ? "opacity-0" : ""}`} style={{ top: CHIPS_TOP }}>
        <CommandChips commands={config.commands} />
      </div>
      <AnswerCards
        choices={choices}
        correctId={checked && !correct ? "" : correctId}
        selectedId={selectedId}
        checked={checked}
        fadeOut={false}
        hinted={hinted}
        withHint
        rise={LIST_RISE}
        onPick={setSelectedId}
      />
    </HexScreen>
  );
}
