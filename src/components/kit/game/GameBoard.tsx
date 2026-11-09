"use client";

import type { ComponentProps } from "react";
import { HexBoard } from "@/components/sequence/HexBoard";

export type { Command, Dir, HexState } from "@/components/sequence/hexGrid";

export type GameBoardProps = Omit<ComponentProps<typeof HexBoard>, "entryKey" | "width"> & {
  /** The width (px) the board is drawn at; its height follows. */
  width?: number;
  /** A new key plays Hex's entrance again. */
  entryKey?: string;
};

/**
 * The board Hex walks on: a 3 × 3 platform (`kind="grid"`) or a straight row of four tiles
 * (`kind="row"`). Hex stands on his tile with an arrow showing the way he faces, and the battery on its
 * own; both move by spring when `hex` changes. A tile is `{ col, row }` (row 0 at the top), a direction `0` up,
 * `1` right, `2` down, `3` left.
 */
export function GameBoard({ width = 340, entryKey = "kit-game-board", ...board }: GameBoardProps) {
  return <HexBoard {...board} width={width} entryKey={entryKey} />;
}
