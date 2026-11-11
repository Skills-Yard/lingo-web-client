"use client";

import { BounceIn } from "@/components/level-two/BounceIn";
import type { OptionData } from "../types";
import { OptionRow, type RowControl } from "./OptionRow";
import { optionState } from "./state";

export type OptionListProps = {
  options: readonly OptionData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The answer has been checked: it can no longer be changed, and the right one is marked. */
  checked?: boolean;
  /** The right answer. */
  correctId?: string;
  /** With a wrong pick, still show the right one (default). Off: only the pick is marked. */
  revealCorrect?: boolean;
  /** The hint points at this answer. */
  hintId?: string | null;
  compact?: boolean;
  /** The space between rows (px), where it should differ from the usual 6. */
  gap?: number;
  /** The size of the rows' words (px), where it should differ from the usual 14. */
  fontSize?: number;
  /** Keeps the picture's room at the start of every row even when no answer has a picture, so the words start where they do on every other screen (default: only if some answer has one). */
  pictureRoom?: boolean;
  control?: RowControl;
  /** A tick or cross at the end of a checked row (default). */
  marks?: boolean;
  /** The rows bounce in one by one, once `revealed`. */
  stagger?: boolean;
  /** With `stagger`: they stay hidden until this turns on (default: at once). */
  revealed?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * The answers as a column of rows (a picture, the words, a radio) — the usual
 * single-choice question. It fills the width it is given; a screen decides where it stands.
 */
export function OptionList({ options, selectedId, onSelect, checked = false, correctId, revealCorrect = true, hintId = null, compact = false, gap = 6, fontSize, pictureRoom = false, control = "none", marks = true, stagger = false, revealed = true, disabled = false, className = "" }: OptionListProps) {
  const imageSlot = pictureRoom || options.some((option) => option.image);
  return (
    <div role="radiogroup" className={`flex w-full flex-col ${className}`} style={{ gap }}>
      {options.map((option, index) => {
        const row = (
          <OptionRow
            key={option.id}
            option={option}
            state={optionState(option.id, selectedId, checked, correctId, revealCorrect)}
            hinted={hintId === option.id && selectedId === null}
            compact={compact}
            control={control}
            marks={marks}
            imageSlot={imageSlot}
            fontSize={fontSize}
            disabled={disabled || checked}
            onPick={onSelect}
          />
        );
        return stagger ? (
          <BounceIn key={option.id} index={index} shown={revealed} className="w-full">
            {row}
          </BounceIn>
        ) : (
          row
        );
      })}
    </div>
  );
}
