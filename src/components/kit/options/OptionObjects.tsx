"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { feelTap } from "../feel";
import { HINT_FILL, STATE_CARD } from "../tokens";
import type { OptionData } from "../types";
import { optionState } from "./state";

/** An answer that is an object to tap: its words, and a picture of it (an emoji, or `media`). */
export type ObjectOption = OptionData & { media?: ReactNode };

export type OptionObjectsProps = {
  options: readonly ObjectOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  checked?: boolean;
  correctId?: string;
  revealCorrect?: boolean;
  hintId?: string | null;
  /** A wrong pick shakes and spills drops of water once it is checked. */
  spill?: boolean;
  disabled?: boolean;
  className?: string;
};

const CARD_WITH_PICTURE = 100;
const CARD_WORDS_ONLY = 64;

/**
 * Small cards to tap, side by side (three across, or two): an object's picture over its name
 * — "Water bottle", "Football" — or words only. A wrong pick can spill.
 */
export function OptionObjects({ options, selectedId, onSelect, checked = false, correctId, revealCorrect = true, hintId = null, spill = false, disabled = false, className = "" }: OptionObjectsProps) {
  const pictures = options.some((option) => option.media || option.emoji);
  return (
    <div role="radiogroup" className={`grid w-full gap-2.5 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length === 3 ? 3 : 2}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const state = optionState(option.id, selectedId, checked, correctId, revealCorrect);
        const hinted = hintId === option.id && selectedId === null;
        const spilling = spill && checked && state === "wrong";
        return (
          <HintFloat key={option.id} className="relative flex min-w-0" spin={false} active={hinted}>
            <motion.button
              type="button"
              disabled={disabled || checked}
              onClick={() => {
                feelTap();
                onSelect(option.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, x: spilling ? [0, -5, 5, -4, 4, 0] : 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: pictures ? CARD_WITH_PICTURE : CARD_WORDS_ONLY }}
              className={`pointer-events-auto relative isolate flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-visible rounded-[16px] border-4 px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] enabled:cursor-pointer ${
                state === "idle" ? "border-white bg-white dark:border-transparent dark:bg-[#15181E]" : STATE_CARD[state]
              }`}
            >
              {/* The hint's orange fill, wiped in from the left behind the content. */}
              <motion.span
                aria-hidden
                initial={false}
                animate={{ clipPath: hinted ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
                className={`pointer-events-none absolute inset-0 -z-10 rounded-[12px] ${HINT_FILL}`}
              />
              {pictures && <span className="flex h-[46px] items-center justify-center text-[38px] leading-none">{option.media ?? option.emoji}</span>}
              <span className="text-center text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{option.text}</span>
              <AnimatePresence>
                {spilling &&
                  [0, 1, 2, 3, 4].map((drop) => (
                    <motion.span
                      key={drop}
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 text-[18px] leading-none"
                      style={{ left: `${20 + drop * 15}%` }}
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ opacity: [0, 1, 0], y: [0, 36, 70] }}
                      transition={{ duration: 1, delay: drop * 0.12, repeat: 1 }}
                    >
                      💧
                    </motion.span>
                  ))}
              </AnimatePresence>
            </motion.button>
          </HintFloat>
        );
      })}
    </div>
  );
}
