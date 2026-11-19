/** The two commands Hex is given: a step in the direction he faces, and a quarter turn clockwise. */
export type Command = "forward" | "right";

/** Where Hex faces: 0 up, 1 right, 2 down, 3 left (clockwise, so a right turn adds one). */
export type Dir = 0 | 1 | 2 | 3;

/** A tile (row 0 at the top) and the way Hex faces on it. */
export type HexState = { col: number; row: number; dir: Dir };

export const COMMAND_LABEL: Record<Command, string> = { forward: "MOVE FORWARD", right: "TURN RIGHT" };

const DELTA: Record<Dir, { col: number; row: number }> = {
  0: { col: 0, row: -1 },
  1: { col: 1, row: 0 },
  2: { col: 0, row: 1 },
  3: { col: -1, row: 0 },
};

/** The board's size in tiles. */
export type Size = { cols: number; rows: number };
export const GRID: Size = { cols: 3, rows: 3 };
export const ROW: Size = { cols: 4, rows: 1 };

/** Where Hex starts on the 3 x 3 board: the bottom-left tile, facing up. */
export const GRID_START: HexState = { col: 0, row: 2, dir: 0 };
/** Where he starts in the straight row: the leftmost tile, facing right. */
export const ROW_START: HexState = { col: 0, row: 0, dir: 1 };

/** One command later. A step off the board is blocked: he stays where he is (`blocked`). */
export const step = (from: HexState, command: Command, size: Size): HexState & { blocked: boolean } => {
  if (command === "right") return { ...from, dir: ((from.dir + 1) % 4) as Dir, blocked: false };
  const col = from.col + DELTA[from.dir].col;
  const row = from.row + DELTA[from.dir].row;
  const onBoard = col >= 0 && col < size.cols && row >= 0 && row < size.rows;
  return onBoard ? { col, row, dir: from.dir, blocked: false } : { ...from, blocked: true };
};

/** Where Hex is after each command: the start first, then one entry per command. */
export const trace = (start: HexState, commands: readonly Command[], size: Size): (HexState & { blocked: boolean })[] => {
  const states = [{ ...start, blocked: false }];
  for (const command of commands) states.push(step(states[states.length - 1], command, size));
  return states;
};

export const endOf = (start: HexState, commands: readonly Command[], size: Size): HexState => {
  const states = trace(start, commands, size);
  return states[states.length - 1];
};

export const sameTile = (a: { col: number; row: number }, b: { col: number; row: number }) => a.col === b.col && a.row === b.row;

const ROW_NAMES = ["Top", "Centre", "Bottom"] as const;
const COL_NAMES = ["left", "middle", "right"] as const;

/** A tile of the 3 x 3 board in words ("Bottom-middle"; the middle one is "Centre"). */
export const tileName = ({ col, row }: { col: number; row: number }) => {
  if (col === 1 && row === 1) return "Centre";
  return `${ROW_NAMES[row]}-${COL_NAMES[col]}`;
};
