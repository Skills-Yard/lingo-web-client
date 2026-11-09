"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { endOf, GRID, GRID_START, ROW, ROW_START, sameTile, step, type Command, type HexState } from "@/components/sequence/hexGrid";
import { useHexRun } from "@/components/sequence/useHexRun";
import { PillButton } from "../buttons/PillButton";
import { TipCard } from "../text/TipCard";
import { COMMANDS } from "./commands";
import { GameBoard } from "./GameBoard";
import { MovePad, type MoveControl } from "./MovePad";
import { ProgramBuilder, type PlanItem } from "./ProgramBuilder";

export type GameResult = {
  /** Hex ended on the battery. */
  correct: boolean;
  /** Where he ended. */
  end: HexState;
  /** The commands that were given, in order. */
  commands: Command[];
};

export type HexGameProps = {
  /** `grid`: the 3 × 3 platform. `row`: a straight row of four tiles. */
  board?: "grid" | "row";
  /** Where Hex starts (default: the bottom-left of the grid, facing up; the left end of the row, facing right). */
  start?: HexState;
  /** The tile the battery is on. */
  goal: { col: number; row: number };
  /**
   * `program`: the learner writes a list of commands, then runs it.
   * `move`: each button moves Hex at once, a step at a time.
   */
  mode?: "program" | "move";
  /** The most commands a program can hold (`program` mode). */
  maxCommands?: number;
  /** The commands on offer (default: move forward and turn right). */
  commands?: readonly Command[];
  /** What Hex's tip card says at the start. */
  tip?: string;
  /** The board's width (px). */
  width?: number;
  /** Called when Hex has reached the battery, or a program has run out without getting him there. */
  onResult?: (result: GameResult) => void;
};

const MOVE_CONTROLS: Record<Command, MoveControl> = {
  forward: { id: "forward", label: "Move forward", icon: "up", tone: "blue" },
  right: { id: "right", label: "Turn right", icon: "turn-right", tone: "orange" },
};

/**
 * A playable Hex level, from data: the board, where Hex starts, where the battery is, and
 * whether the learner writes a program (`program`) or walks him step by step (`move`). It plays
 * Hex's walk, takes the battery when he gets there, and reports the outcome through `onResult`.
 * It is content only — a screen puts it in a frame and decides what a result leads to.
 */
export function HexGame({ board = "grid", start, goal, mode = "program", maxCommands = 4, commands = COMMANDS, tip, width = 340, onResult }: HexGameProps) {
  const size = board === "grid" ? GRID : ROW;
  const base = board === "grid" ? GRID_START : ROW_START;
  const col = start?.col ?? base.col;
  const row = start?.row ?? base.row;
  const dir = start?.dir ?? base.dir;
  const from = useMemo<HexState>(() => ({ col, row, dir }), [col, row, dir]);

  const run = useHexRun(from, size);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [moves, setMoves] = useState<Command[]>([]);
  const [outcome, setOutcome] = useState<"solved" | "missed" | null>(null);
  const reported = useRef(false);

  const hex = mode === "move" ? endOf(from, moves, size) : run.hex;
  const solved = outcome === "solved";

  const report = useCallback(
    (end: HexState, given: Command[]) => {
      if (reported.current) return;
      const correct = sameTile(end, goal);
      reported.current = correct;
      setOutcome(correct ? "solved" : "missed");
      onResult?.({ correct, end, commands: given });
    },
    [goal, onResult],
  );

  const reset = () => {
    reported.current = false;
    setOutcome(null);
    setItems([]);
    setMoves([]);
    run.reset();
  };

  const walk = (command: Command) => {
    if (solved) return;
    const next = [...moves, command];
    setMoves(next);
    const end = endOf(from, next, size);
    if (sameTile(end, goal)) report(end, next);
    else if (step(hex, command, size).blocked) setOutcome("missed");
    else setOutcome(null);
  };

  const play = () => {
    const given = items.map((item) => item.command);
    setOutcome(null);
    reported.current = false;
    run.play(given, (end) => report(end, given));
  };

  const message = solved
    ? "Hex got the battery!"
    : outcome === "missed"
      ? mode === "move"
        ? "Hex can't go that way. Try another move."
        : "Hex didn't reach the battery. Change the commands and run again."
      : (tip ?? (mode === "move" ? "Walk Hex to the battery." : "Give Hex commands to reach the battery."));

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <GameBoard kind={board} hex={hex} battery={goal} collected={solved} width={width} />
      <TipCard text={message} tone={solved ? "success" : outcome === "missed" ? "warning" : "tip"} className="max-w-[340px]" />
      {mode === "move" ? (
        <>
          <MovePad controls={commands.map((command) => MOVE_CONTROLS[command])} onPress={(id) => walk(id as Command)} disabled={solved} />
          {moves.length > 0 && <PillButton look="outline" label="Start over" icon={<RotateCcw aria-hidden className="size-4" />} onClick={reset} />}
        </>
      ) : (
        <ProgramBuilder palette={commands} items={items} max={maxCommands} onChange={setItems} onRun={play} onReset={reset} running={run.running} disabled={solved} />
      )}
    </div>
  );
}
