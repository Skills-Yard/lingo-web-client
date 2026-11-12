"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { RAISED } from "@/components/ui/raised";
import { BounceIn } from "./BounceIn";
import { aboveButtons } from "./LevelTwoShell";
import { SlotImage } from "./SlotImage";
import { COLUMN_W } from "@/lib/questionColumn";
import { COLUMN_LEFT, type Choice } from "./levelTwo";

/** What the cards rise by once the result panel is up, so it never covers them. */
export const CARDS_RISE = 180;
/** Figma has the cards end at 726 (frame px), 16px above its button; the
 * shell's button (and the hint beside it) is drawn taller, so they end this
 * far above it instead. */
export const GAP_ABOVE_BUTTONS = 28;
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
  /** How far they rise once the result panel is up (default `CARDS_RISE`). */
  rise?: number;
  /** Shorter rows (56px) for answers that are only words, so four fit above the button. */
  compact?: boolean;
  /** Rows of exactly this height (px), pictures included, for a screen whose picture must stay clear of the list. */
  rowHeight?: number;
  /** The classes (border and fill) of a row at rest, where they should differ from the usual faint outline. */
  idleLook?: string;
  /** The space between rows (px), where it should differ from the usual 6. */
  gap?: number;
  /** The text's size (px), where it should differ from the usual 14. */
  fontSize?: number;
  /** The rows bounce in one by one instead of the whole list rising together. */
  bounceIn?: boolean;
  /** With `bounceIn`: they stay hidden until this turns on (default: at once). */
  revealed?: boolean;
  onPick: (id: string) => void;
};

/**
 * The three answers (Figma "Frame 322"): 76px-tall white cards 6px apart, as wide
 * as the column (`SIDE_MARGIN` in from each side), with a picture, the text and a radio. Pinned to the button row; once `checked` they
 * rise to make room for the result panel.
 */
export function AnswerCards({ choices, correctId, selectedId, checked, fadeOut, hinted, withHint, rise = CARDS_RISE, compact = false, rowHeight, idleLook, gap = 6, fontSize, bounceIn = false, revealed = true, onPick }: AnswerCardsProps) {
  return (
    <motion.div
      initial={bounceIn ? false : { opacity: 0, y: 90 }}
      animate={{ opacity: 1, y: checked ? -rise : 0 }}
      transition={
        checked
          ? PANEL_SPRING
          : { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } }
      }
      className="pointer-events-auto absolute z-[1] flex flex-col"
      style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, withHint), left: COLUMN_LEFT, width: COLUMN_W, gap }}
    >
      {choices.map((choice, index) => {
        const state = optionState(choice.id, selectedId, checked, correctId);
        const look = LOOKS[state];
        const hintHere = hinted && selectedId === null && choice.id === correctId;
        const row = (
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
              style={rowHeight ? { height: rowHeight, paddingBlock: 6 } : undefined}
              className={`relative isolate flex ${compact ? "h-[56px] gap-3 py-1.5" : "h-[76px] gap-[34px] py-2.5"} w-full cursor-pointer items-center justify-between overflow-hidden rounded-[18px] border px-3.5 text-left ${RAISED} ${look.edge} ${
                state === "idle" ? (idleLook ?? "border-black/4 bg-white dark:border-[#818185] dark:bg-[#15181E]") : look.card
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
              <span className={`flex min-w-0 flex-1 items-center ${compact ? "gap-3" : "gap-[22px]"}`}>
                {/* Figma "image 360" (46.68 x 47.31): the text starts at the same place on every card. */}
                <span className="flex h-[47.31px] w-[46.68px] shrink-0 items-center justify-center">
                  <SlotImage file={choice.icon} className="max-h-full max-w-full object-contain" />
                </span>
                <span
                  className="min-w-0 flex-1 text-[14px] leading-[22px] font-medium text-[#444444] dark:text-white"
                  style={fontSize ? { fontSize, lineHeight: `${fontSize + 8}px` } : undefined}
                >
                  {choice.text}
                </span>
              </span>
              {/* Figma "Ellipse 3" (34 x 34), at the row's end. */}
              {!compact && <span aria-hidden className="size-[34px] shrink-0 rounded-full" />}
            </motion.button>
          </HintFloat>
        );
        return bounceIn ? (
          <BounceIn key={choice.id} index={index} shown={revealed} className="w-full">
            {row}
          </BounceIn>
        ) : (
          row
        );
      })}
    </motion.div>
  );
}
