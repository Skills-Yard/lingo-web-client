"use client";

import type { OptionData } from "../types";
import { OptionRow } from "./OptionRow";
import { multiOptionState } from "./state";

export type PickAllProps = {
  options: readonly OptionData[];
  /** The ids that are ticked. */
  selectedIds: readonly string[];
  /** Ticks or unticks one. */
  onToggle: (id: string) => void;
  checked?: boolean;
  /** The ids that should be ticked. */
  correctIds?: readonly string[];
  /** Also mark the right ones that were missed (default). */
  revealCorrect?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
};

/** "Pick all that apply": rows with a checkbox, any number of which can be ticked. */
export function PickAll({ options, selectedIds, onToggle, checked = false, correctIds, revealCorrect = true, compact = false, disabled = false, className = "" }: PickAllProps) {
  const imageSlot = options.some((option) => option.image);
  return (
    <div role="group" className={`flex w-full flex-col gap-1.5 ${className}`}>
      {options.map((option) => (
        <OptionRow
          key={option.id}
          option={option}
          state={multiOptionState(option.id, selectedIds, checked, correctIds, revealCorrect)}
          control="checkbox"
          compact={compact}
          imageSlot={imageSlot}
          disabled={disabled || checked}
          onPick={onToggle}
        />
      ))}
    </div>
  );
}
