"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { XpPop } from "@/components/level-one/FeedbackPanel";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { aboveButtons } from "./LevelTwoShell";
import { SlotImage } from "./SlotImage";
import type { Choice } from "./levelTwo";

/** What the cards rise by once the result panel is up, so it never covers them. */
export const CARDS_RISE = 180;
/** Figma has the cards end at 726 (frame px), 16px above its button; the
 * shell's button (and the hint beside it) is drawn taller, so they end this
 * far above it instead. */
export const GAP_ABOVE_BUTTONS = 12;
/** The result panel's own spring (see FeedbackPanel), so the cards rise as it arrives. */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

type AnswerCardsProps = {
  choices: readonly Choice[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out completely, so the robot's move behind them can be seen. */
  fadeOut: boolean;
  /** The hint was used: the right card is filled in orange until something is picked. */
  hinted: boolean;
  /** The screen has the hint button beside its main button. */
  withHint: boolean;
  onPick: (id: string) => void;
};

/**
 * The three answers (Figma "Frame 322"): 358 x 76 white cards 6px apart with a
 * picture, the text and a radio. Pinned to the button row; once `checked` they
 * rise to make room for the result panel.
 */
export function AnswerCards({ choices, correctId, selectedId, checked, fadeOut, hinted, withHint, onPick }: AnswerCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 90 }}
      animate={{ opacity: 1, y: checked ? -CARDS_RISE : 0 }}
      transition={
        checked
          ? PANEL_SPRING
          : { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } }
      }
      className="pointer-events-auto absolute z-[1] flex w-[358px] flex-col gap-1.5"
      style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, withHint), left: "calc(50% - 179px)" }}
    >
      {choices.map((choice) => {
        const state = optionState(choice.id, selectedId, checked, correctId);
        const look = LOOKS[state];
        const hintHere = hinted && selectedId === null && choice.id === correctId;
        return (
          <HintFloat key={choice.id} className="relative w-full" spin={false} active={hintHere}>
            <motion.button
              type="button"
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                onPick(choice.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, opacity: fadeOut ? 0 : 1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative isolate flex h-[76px] w-full cursor-pointer items-center justify-between gap-[34px] overflow-hidden rounded-[18px] border px-3.5 py-2.5 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-[background-color,border-color] ${
                state === "idle" ? "border-black/4 bg-white dark:border-white/6 dark:bg-[#15181E]" : look.card
              }`}
            >
              {/* The hint's orange fill, wiped in from the left behind the content. */}
              <motion.span
                aria-hidden
                initial={false}
                animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
                className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
              />
              <span className="flex min-w-0 items-center gap-3.5">
                {/* The picture's slot: 55px wide, so the text starts at 99px on every card. */}
                <span className="flex h-[47px] w-[55px] shrink-0 items-center justify-center">
                  <SlotImage file={choice.icon} className="max-h-full max-w-full object-contain" />
                </span>
                <span className="w-[186px] text-[14px] leading-[22px] font-medium text-[#444444] dark:text-white">{choice.text}</span>
              </span>
            </motion.button>
            <XpPop inside show={checked && choice.id === correctId && selectedId === correctId} fading={fadeOut} />
          </HintFloat>
        );
      })}
    </motion.div>
  );
}
