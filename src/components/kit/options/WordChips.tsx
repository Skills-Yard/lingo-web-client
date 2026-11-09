"use client";

import { motion } from "framer-motion";
import { feelTap } from "../feel";
import { STATE_CARD, tintClass } from "../tokens";
import type { OptionData } from "../types";
import { multiOptionState } from "./state";

export type WordChipsProps = {
  options: readonly OptionData[];
  selectedIds: readonly string[];
  /** Called with the chip's id: toggle it (`multiple`) or make it the only pick. */
  onSelect: (id: string) => void;
  /** Several chips can be picked (default: one). */
  multiple?: boolean;
  checked?: boolean;
  correctIds?: readonly string[];
  revealCorrect?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

/** Short answers as pills that wrap across the width: a word bank, tags, one-word choices. */
export function WordChips({ options, selectedIds, onSelect, multiple = false, checked = false, correctIds, revealCorrect = true, size = "md", disabled = false, className = "" }: WordChipsProps) {
  return (
    <div role={multiple ? "group" : "radiogroup"} className={`flex w-full flex-wrap justify-center gap-2 ${className}`}>
      {options.map((option) => {
        const state = multiOptionState(option.id, selectedIds, checked, correctIds, revealCorrect);
        return (
          <motion.button
            key={option.id}
            type="button"
            disabled={disabled || checked}
            aria-pressed={state === "selected"}
            onClick={() => {
              feelTap();
              onSelect(option.id);
            }}
            animate={{ scale: state === "selected" ? [1, 0.93, 1.06, 1] : 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`pointer-events-auto cursor-pointer rounded-full border-2 font-semibold text-[#444444] shadow-[0_3px_0_rgba(0,0,0,0.1)] transition-[background-color,border-color] enabled:active:translate-y-px enabled:active:shadow-[0_2px_0_rgba(0,0,0,0.1)] disabled:cursor-default dark:text-white ${
              size === "sm" ? "px-3.5 py-1.5 text-[14px] leading-5" : "px-5 py-2.5 text-[16px] leading-6"
            } ${state === "idle" ? `border-black/6 dark:border-white/15 ${tintClass(option.tint)}` : STATE_CARD[state]}`}
          >
            {option.text}
          </motion.button>
        );
      })}
    </div>
  );
}
