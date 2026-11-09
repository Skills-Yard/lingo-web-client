"use client";

import { BounceIn } from "@/components/level-two/BounceIn";
import type { OptionData } from "../types";
import { OptionTile, type TileSize } from "./OptionTile";
import { optionState } from "./state";

export type GridLayout = TileSize | "auto";

export type OptionGridProps = {
  options: readonly OptionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /**
   * How the tiles stand: `pair` (two big cards), `three` (three small tiles), `grid`
   * (four, two by two) or `cards` (two very big ones). `auto` picks by how many answers there are.
   */
  layout?: GridLayout;
  checked?: boolean;
  correctId?: string;
  revealCorrect?: boolean;
  hintId?: string | null;
  /** The tiles bounce in one by one, once `revealed`. */
  stagger?: boolean;
  revealed?: boolean;
  disabled?: boolean;
  className?: string;
};

/** The layout `auto` picks for this many answers. */
export const layoutFor = (count: number): TileSize => (count <= 2 ? "pair" : count === 3 ? "three" : "grid");

/** The answers as cards side by side: two big ones, three small tiles, or four in a two-by-two. */
export function OptionGrid({ options, selectedId, onSelect, layout = "auto", checked = false, correctId, revealCorrect = true, hintId = null, stagger = false, revealed = true, disabled = false, className = "" }: OptionGridProps) {
  const size = layout === "auto" ? layoutFor(options.length) : layout;
  return (
    <div role="radiogroup" className={`w-full gap-3.5 ${size === "grid" ? "grid grid-cols-2" : "flex items-stretch"} ${className}`}>
      {options.map((option, index) => {
        const tile = (
          <OptionTile
            key={option.id}
            option={option}
            size={size}
            state={optionState(option.id, selectedId, checked, correctId, revealCorrect)}
            hinted={hintId === option.id && selectedId === null}
            disabled={disabled || checked}
            onPick={onSelect}
          />
        );
        return stagger ? (
          <BounceIn key={option.id} index={index} shown={revealed} className="flex min-w-0 flex-1">
            {tile}
          </BounceIn>
        ) : (
          tile
        );
      })}
    </div>
  );
}
