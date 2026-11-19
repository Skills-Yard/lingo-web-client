"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trace, type Command, type HexState, type Size } from "./hexGrid";

/** How long each command takes to play out (ms): a step is a walk, a turn is quicker. */
const STEP_MS = { forward: 720, right: 620 } as const;
/** The pause before the first command, so the learner sees Hex at the start. */
const LEAD_MS = 350;

/**
 * Hex's place on a board and the way he carries out a list of commands: one at
 * a time, each given its time to play, ending with where he is (`onDone`).
 * `start` and `size` are fixed for the board (constants).
 */
export function useHexRun(start: HexState, size: Size) {
  const [hex, setHex] = useState<HexState>(start);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clear, [clear]);

  /** Puts Hex back on `to` (the start by default) and stops whatever he was doing. */
  const reset = useCallback(
    (to: HexState = start) => {
      clear();
      setRunning(false);
      setHex(to);
    },
    [clear, start],
  );

  /** Plays `commands` from the start; `onDone` gets where he ends. */
  const play = useCallback(
    (commands: readonly Command[], onDone?: (end: HexState) => void) => {
      clear();
      setHex(start);
      setRunning(true);
      const states = trace(start, commands, size);
      let at = LEAD_MS;
      commands.forEach((command, index) => {
        const next = states[index + 1];
        timers.current.push(window.setTimeout(() => setHex({ col: next.col, row: next.row, dir: next.dir }), at));
        at += STEP_MS[command];
      });
      timers.current.push(
        window.setTimeout(() => {
          setRunning(false);
          onDone?.(states[states.length - 1]);
        }, at),
      );
    },
    [clear, size, start],
  );

  return { hex, running, play, reset };
}
