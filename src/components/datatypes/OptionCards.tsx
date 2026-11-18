"use client";

import { motion } from "framer-motion";
import { PointedLook } from "@/components/level-one/answerHint";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { BounceIn } from "@/components/level-two/BounceIn";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { RightBounce } from "@/components/level-two/RightBounce";
import { WaveBounce, waveDelay } from "@/components/level-two/WaveBounce";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED } from "@/components/ui/raised";
import { IDLE_LOOK, OPTION } from "@/components/variable/quiz";
import { vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import type { Option } from "./screen";

/**
 * The answers of a Data Types question are the Variable module's: words only, the same size, gap, padding, corners
 * and text on every screen (`OPTION`, `IDLE_LOOK`: change them in `variable/quiz.ts` and both modules follow). Three
 * answers of at most `MAX_OPTION_WORDS` words are mini cards in one row, four short ones are cards two by two, and
 * anything else (two answers, longer ones) is a list of 56px rows.
 */

/** The most words an answer may have. Three answers this short stand as mini cards in one row (one card tall, clear of the scene); a longer one would not fit its card. */
export const MAX_OPTION_WORDS = 2;
/** Four answers this short (letters) stand as two rows of two cards. */
const FOUR_ANSWER_CHARS = 18;

/** An answer that is only a number (digits and signs, no letters: 15, “123”, 25.5) is set larger than words are: it is short, and a card has the room. A long one (a phone number) gets a smaller size so it still fits a card. */
const NUMBER_FONT = 24;
const LONG_NUMBER_FONT = 20;
const LONG_NUMBER_CHARS = 7;
export const optionFont = (text: string) => {
  if (/\p{L}/u.test(text) || !/\d/.test(text)) return OPTION.font;
  return text.length <= LONG_NUMBER_CHARS ? NUMBER_FONT : LONG_NUMBER_FONT;
};

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const columnsFor = (count: number) => (count === 3 ? 3 : 2);
/**
 * The side padding (px, border included) of a card. Three across on a phone are (340 - 2 x 14) / 3 = 104px cards, and the widest
 * two-word answer's widest word ("Numerical") is about 87px, so the usual 12px a side (80px inside) does not hold it: the cards
 * take 8px here, so the three stay the same size instead of the one with the long word growing at the others' cost.
 */
const padXFor = (count: number) => (count === 3 ? 8 : OPTION.padX);

/** Whether the answers are cards across (three of at most `MAX_OPTION_WORDS` words, or four short ones two by two) rather than rows. */
export const acrossCards = (options: readonly Option[]) =>
  (options.length === 3 && options.every((option) => wordCount(option.text) <= MAX_OPTION_WORDS)) || (options.length === 4 && options.every((option) => option.text.length <= FOUR_ANSWER_CHARS));

/** The height the answers take (px). */
export const answersHeight = (options: readonly Option[]) => {
  if (!acrossCards(options)) return options.length * OPTION.height + (options.length - 1) * OPTION.gap;
  const rows = Math.ceil(options.length / columnsFor(options.length));
  return rows * OPTION.height + (rows - 1) * OPTION.gap;
};

/** The result panel's own spring (see FeedbackPanel), so the cards rise as it arrives. */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The answers' own way in. */
const ANSWERS_IN = { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } } as const;

/** Cards to tap, side by side (three across, or two by two), in the place and the way the rows of answers stand. */
export function OptionGrid({
  options,
  correctId,
  selectedId,
  checked,
  fadeOut,
  pointedId,
  withHint,
  rise,
  bounceIn,
  revealed,
  wave = false,
  onPick,
}: {
  options: readonly Option[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out (a wrong answer, where a scene shows what was picked). */
  fadeOut: boolean;
  /** The card the hint's hand is on (see `useAnswerHint`): it takes a tint and a shine. */
  pointedId: string | null;
  withHint: boolean;
  /** How far (px) they rise once the result panel is up. */
  rise: number;
  /** The cards bounce in one by one instead of the whole grid rising together. */
  bounceIn?: boolean;
  /** With `bounceIn`: they stay hidden until this turns on. */
  revealed: boolean;
  /** A right answer sends a wave through the cards (each hops a little, one after another in reading order) and the right one's jump comes as the wave reaches it. */
  wave?: boolean;
  onPick: (id: string) => void;
}) {
  // The wave runs once the right card shows as right.
  const won = wave && options.some((option) => optionState(option.id, selectedId, checked, correctId) === "correct");
  return (
    <motion.div
      initial={bounceIn ? false : { opacity: 0, y: 90 }}
      animate={{ opacity: fadeOut ? 0 : 1, y: checked ? -rise : 0 }}
      transition={checked ? { y: PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : ANSWERS_IN}
      className="pointer-events-auto absolute z-[1] grid"
      // Equal columns, always: every card on a screen is the same size (a card's own words never widen its column).
      style={{ bottom: aboveButtons(OPTION.aboveButtons, withHint), left: COLUMN_LEFT, width: COLUMN_W, gap: OPTION.gap, gridTemplateColumns: `repeat(${columnsFor(options.length)}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const state = optionState(option.id, selectedId, checked, correctId);
        const padX = padXFor(options.length);
        const pointed = pointedId === option.id && state === "idle";
        const plainCard = (
          <div key={option.id} className="relative flex min-w-0 flex-1">
            <motion.button
              type="button"
              data-hint={option.id}
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                onPick(option.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              // The side padding makes up the border's width (a 1px line + the rest at rest, a 4px border + the rest picked: `padX` either way), so a card is as wide picked as at rest and nothing around it moves.
              style={{ height: OPTION.height, borderRadius: OPTION.radius, paddingInline: state === "idle" ? padX - 1 : padX - 4 }}
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center overflow-visible ${RAISED} ${LOOKS[state].edge} ${
                state === "idle" ? `border ${IDLE_LOOK}` : `border-4 ${LOOKS[state].card}`
              }`}
            >
              {/* Two words stand on two lines when they do not fit on one (the card is 56px tall, two lines are 40). */}
              <span className="text-center leading-5 font-semibold text-[#444444] dark:text-white" style={{ fontSize: optionFont(option.text), lineHeight: optionFont(option.text) > OPTION.font ? 1.2 : undefined }}>
                {option.text}
              </span>
              <PointedLook pointed={pointed} />
            </motion.button>
          </div>
        );
        // The right card jumps a little after the check, so the cards have risen above the result panel by the time it does.
        const bounce = (
          // `flex-1`: inside the bounce-in box (a flex row) it must fill the grid cell, or each card is only as wide as its words.
          <RightBounce key={option.id} play={state === "correct"} delay={wave ? waveDelay(index) : 0.2} radius={OPTION.radius} className="flex min-w-0 flex-1">
            {plainCard}
          </RightBounce>
        );
        const card = wave ? (
          <WaveBounce key={option.id} play={won && state !== "correct"} delay={waveDelay(index)} className="flex min-w-0 flex-1">
            {bounce}
          </WaveBounce>
        ) : (
          bounce
        );
        return bounceIn ? (
          <BounceIn key={option.id} index={index} shown={revealed} className="flex min-w-0">
            {card}
          </BounceIn>
        ) : (
          card
        );
      })}
    </motion.div>
  );
}
