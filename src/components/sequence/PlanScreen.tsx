"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOVES, MoveTile, type MoveId } from "@/components/level-one/MoveHexScreen";
import { Teal } from "@/components/level-two/LevelTwoShell";
import { useBatteryClaim } from "@/components/level-one/useBatteryClaim";
import { playClickSound } from "@/components/onboarding/clickSound";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { ChipList, chipListSize, moveItem, type PlanItem } from "./ChipList";
import { HexBoard } from "./HexBoard";
import { HexScreen } from "./HexScreen";
import { GRID, GRID_START, sameTile, trace, type Command } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";
import { useHexRun } from "./useHexRun";

export type PlanRoute = "base" | "complex";

/** Where the battery stands: the base route takes Hex to the centre-right tile, the complex one to the top-right corner. */
const ROUTES = {
  base: {
    step: STEP.plan,
    title: (
      <>
        Plan HEX’s <Teal>journey.</Teal>
      </>
    ),
    battery: { col: 2, row: 1 },
    /** forward, right, forward, forward */
    slots: 4,
  },
  complex: {
    step: STEP.planNext,
    title: (
      <>
        A longer <Teal>journey!</Teal>
      </>
    ),
    battery: { col: 2, row: 0 },
    /** forward, forward, right, forward, forward */
    slots: 5,
  },
} as const;

const BOARD_TOP = 130;
const LIST_TOP = 424;

/** The game screen's move buttons (see `MoveTile`): Move Forward is Go Straight's box and arrow, Turn Right keeps its own. */
const PALETTE: Record<Command, { move: MoveId; label: string }> = {
  forward: { move: "straight", label: "Move Forward" },
  right: { move: "right", label: "Turn Right" },
};

/** A command to add to the list. */
function PaletteButton({ command, disabled, onPress }: { command: Command; disabled: boolean; onPress: () => void }) {
  const { move, label } = PALETTE[command];
  const look = MOVES.find((candidate) => candidate.id === move)!;
  return <MoveTile label={label} icon={look.icon} look={look.look} disabled={disabled} dim onPress={onPress} />;
}

type Phase = "edit" | "running" | "checked";

/**
 * "Plan HEX's journey.": the learner builds the whole sequence themselves — tap
 * a command to add it, drag to reorder, tap one to take it out — and then presses
 * Run, and Hex carries it out one command at a time. Any sequence that ends on
 * the battery works. After a miss the list stays as it was and the tile Hex's
 * first command took him to is ringed.
 */
export function PlanScreen({ route }: { route: PlanRoute }) {
  const router = useRouter();
  const config = ROUTES[route];
  const { hex, running, play, reset } = useHexRun(GRID_START, GRID);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [phase, setPhase] = useState<Phase>("edit");
  const [correct, setCorrect] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [ring, setRing] = useState<{ col: number; row: number } | null>(null);
  const nextId = useRef(0);
  const { win, popup } = useBatteryClaim(undefined, { rationed: true });
  const commands = items.map((item) => item.command);
  const editing = phase === "edit";
  // As many places as the shortest route takes; the command buttons stand 20px under them.
  const maxCommands = config.slots;
  const list = chipListSize(maxCommands);
  const paletteTop = LIST_TOP + list.height + 20;

  const add = (command: Command) => {
    playClickSound();
    vibrateForTap();
    setItems((now) => (now.length >= maxCommands ? now : [...now, { id: nextId.current++, command }]));
  };

  const run = () => {
    setPhase("running");
    setRing(null);
    play(commands, (end) => {
      const right = sameTile(end, config.battery);
      setCorrect(right);
      setPhase("checked");
      noteFirstTry(config.step, right);
      if (!right) {
        noteStruggle(config.step, "miss");
        const first = trace(GRID_START, commands, GRID)[1];
        setRing({ col: first.col, row: first.row });
      }
      vibrateForAnswer(right);
      setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right }));
      if (right) win();
    });
  };

  const tryAgain = () => {
    reset();
    setPhase("edit");
    setAnswer(null);
  };

  const onContinue = () => {
    if (editing) run();
    else if (correct) router.push(sequenceNext(config.step));
    else tryAgain();
  };

  return (
    <HexScreen
      step={config.step}
      title={config.title}
      board={<HexBoard kind="grid" hex={hex} battery={config.battery} collected={phase === "checked" && correct} ring={editing ? ring : null} width={260} entryKey={`hex-plan-${route}`} />}
      boardTop={BOARD_TOP}
      panel={{
        correct,
        title: correct ? "Great!" : "Not yet",
        text: correct ? "You planned the commands before running them." : "Check where HEX first went off track.",
        open: phase === "checked",
      }}
      celebrate={phase === "checked" && correct}
      overlay={popup}
      answer={answer}
      ctaLabel={phase !== "checked" ? "Run" : correct ? "Next" : "Try again"}
      ctaDisabled={editing ? items.length === 0 || running : phase === "running"}
      onContinue={onContinue}
    >
      <p className="absolute inset-x-0 text-center text-[13px] leading-4 font-semibold tracking-[0.4px] text-[#6B7480] uppercase dark:text-white/60" style={{ top: LIST_TOP - 22 }}>
        {items.length === 0 ? "Tap a command to add it" : "Your sequence"}
      </p>
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: LIST_TOP, width: list.width, height: list.height }}>
        <ChipList
          items={items}
          max={maxCommands}
          disabled={!editing}
          onMove={(from, to) => setItems((now) => moveItem(now, from, to))}
          onRemove={(index) => {
            playClickSound();
            vibrateForTap();
            setItems((now) => now.filter((_, position) => position !== index));
          }}
        />
      </div>
      <div className="absolute inset-x-0 flex justify-center gap-[18px]" style={{ top: paletteTop }}>
        <PaletteButton command="forward" disabled={!editing || items.length >= maxCommands} onPress={() => add("forward")} />
        <PaletteButton command="right" disabled={!editing || items.length >= maxCommands} onPress={() => add("right")} />
      </div>
    </HexScreen>
  );
}
