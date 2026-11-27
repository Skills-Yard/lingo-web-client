"use client";

import { motion } from "framer-motion";
import { PointedLook } from "@/components/level-one/answerHint";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { BounceIn } from "@/components/level-two/BounceIn";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { RightBounce } from "@/components/level-two/RightBounce";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED } from "@/components/ui/raised";
import { IDLE_LINE, IDLE_LOOK, OPTION } from "@/components/variable/quiz";
import { vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import type { Option, QuizStage } from "./screen";

/**
 * The answers of a Data Types question are the Variable module's: words only, the same size, gap, padding, corners
 * and text on every screen (`OPTION`, `IDLE_LOOK`: change them in `variable/quiz.ts` and both modules follow). Three
 * answers of at most `MAX_OPTION_WORDS` words are mini cards in one row, four short ones are cards two by two, six short
 * ones are cards three across in two rows, and anything else (two answers, longer ones) is a list of 56px rows.
 */

/** The most words an answer may have. Three answers this short stand as mini cards in one row (one card tall, clear of the scene); a longer one would not fit its card. */
export const MAX_OPTION_WORDS = 2;
/** Four answers this short (letters) stand as two rows of two cards, and six as two rows of three (a longer one wraps to two lines on its card). */
const CARD_ANSWER_CHARS = 18;

/** An answer that is only a number (digits and signs, no letters: 15, “123”, 25.5) is set larger than words are: it is short, and a card has the room. A long one (a phone number) gets a smaller size so it still fits a card. */
const NUMBER_FONT = 24;
const LONG_NUMBER_FONT = 20;
const LONG_NUMBER_CHARS = 7;
export const optionFont = (text: string) => {
  if (/\p{L}/u.test(text) || !/\d/.test(text)) return OPTION.font;
  return text.length <= LONG_NUMBER_CHARS ? NUMBER_FONT : LONG_NUMBER_FONT;
};

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const columnsFor = (count: number) => (count === 3 || count === 6 ? 3 : 2);
/**
 * The side padding (px, border included) of a card. Three across on a phone are (340 - 2 x 14) / 3 = 104px cards, and the widest
 * two-word answer's widest word ("Numerical") is about 87px, so the usual 12px a side (80px inside) does not hold it: the cards
 * take 8px here, so the three stay the same size instead of the one with the long word growing at the others' cost.
 */
const padXFor = (count: number) => (count === 3 || count === 6 ? 8 : OPTION.padX);

/**
 * Whether the answers are cards across (three of at most `MAX_OPTION_WORDS` words, or four short ones two by two, or six short ones three by two) rather than rows.
 * `three` makes any three answers cards (a screen that has checked they are short enough, as `4 * 5` is: three "words" but about 50px wide).
 */
export const acrossCards = (options: readonly Option[], three = false) =>
  (options.length === 3 && (three || options.every((option) => wordCount(option.text) <= MAX_OPTION_WORDS))) ||
  ((options.length === 4 || options.length === 6) && options.every((option) => option.text.length <= CARD_ANSWER_CHARS));

/**
 * The picture cards (`QuizStage.layout` "pictures", screen 1): two across, each a tinted card with its picture over its word, a little
 * narrower than the column (the design's cards are about 108 wide, centred, not stretched to its edges).
 */
export const PICTURE_CARD = { width: 108, height: 92, gap: 14, icon: { width: 52, height: 40 } } as const;

/** Three picture cards stand in one row (screen 5), anything else two to a row (screen 1). */
const pictureColumns = (count: number) => (count === 3 ? 3 : 2);
/** A picture card's height (px): three across are narrow, so their words can take two lines and they are as tall as the Variable module's picture cards. */
const pictureCardHeight = (count: number) => (count === 3 ? OPTION.pictureHeight : PICTURE_CARD.height);

/** The height (px) `count` picture cards take. */
export const pictureGridHeight = (count: number) => {
  const lines = Math.ceil(count / pictureColumns(count));
  return lines * pictureCardHeight(count) + (lines - 1) * PICTURE_CARD.gap;
};

/** The height the answers take (px). `layout` is the screen's own choice (`QuizStage.layout`): "rows" is a column of rows whatever their number, "pictures" the picture cards. */
export const answersHeight = (options: readonly Option[], three = false, layout?: QuizStage["layout"]) => {
  if (layout === "pictures") return pictureGridHeight(options.length);
  if (layout === "rows" || !acrossCards(options, three)) return options.length * OPTION.height + (options.length - 1) * OPTION.gap;
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
  top,
  move,
  onPick,
}: {
  options: readonly Option[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** Where the cards hang from (a CSS `top`), under what is above them, instead of standing on the main button; `move` is the CSS transition that takes them there. */
  top?: string;
  move?: string;
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
  onPick: (id: string) => void;
}) {
  return (
    <motion.div
      initial={bounceIn ? false : { opacity: 0, y: 90 }}
      animate={{ opacity: fadeOut ? 0 : 1, y: checked ? -rise : 0 }}
      transition={checked ? { y: PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : ANSWERS_IN}
      className="pointer-events-auto absolute z-[1] grid"
      // Equal columns, always: every card on a screen is the same size (a card's own words never widen its column).
      style={{ ...(top === undefined ? { bottom: aboveButtons(OPTION.aboveButtons, withHint) } : { top, transition: move }), left: COLUMN_LEFT, width: COLUMN_W, gap: OPTION.gap, gridTemplateColumns: `repeat(${columnsFor(options.length)}, minmax(0, 1fr))` }}
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
        const card = (
          // `flex-1`: inside the bounce-in box (a flex row) it must fill the grid cell, or each card is only as wide as its words.
          <RightBounce key={option.id} play={state === "correct"} delay={0.2} radius={OPTION.radius} className="flex min-w-0 flex-1">
            {plainCard}
          </RightBounce>
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

/**
 * Picture cards (`PICTURE_CARD`): two by two (or three across in one row, as wide as the column allows), each a tinted card
 * (`option.tint`) with its picture over its word and the app's raised edge under it, as every card has. They hang from `top` (a CSS length, the screen works it out from the scene's bottom edge, as for the
 * rows and cards above), and move there by `move` (a CSS transition, so they follow the scene as it rises).
 * Picked, a card takes the module's picked, right or wrong look (the tint gives way to it) like every other answer.
 */
export function PictureGrid({
  options,
  correctId,
  selectedId,
  checked,
  pointedId,
  top,
  move,
  bounceIn,
  revealed,
  onPick,
}: {
  options: readonly Option[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The card the hint's hand is on (see `useAnswerHint`): it takes a tint and a shine. */
  pointedId: string | null;
  top: string;
  move: string;
  /** The cards bounce in one by one. */
  bounceIn?: boolean;
  /** With `bounceIn`: they stay hidden until this turns on. */
  revealed: boolean;
  onPick: (id: string) => void;
}) {
  const three = pictureColumns(options.length) === 3;
  // Three across have less room for their words than two by two (see `padXFor`).
  const padX = three ? padXFor(3) : OPTION.padX;
  return (
    <div
      className="pointer-events-auto absolute z-[1] grid justify-center"
      style={{ top, transition: move, left: COLUMN_LEFT, width: COLUMN_W, gap: PICTURE_CARD.gap, gridTemplateColumns: three ? "repeat(3, minmax(0, 1fr))" : `repeat(2, ${PICTURE_CARD.width}px)` }}
    >
      {options.map((option, index) => {
        const state = optionState(option.id, selectedId, checked, correctId);
        const pointed = pointedId === option.id && state === "idle";
        const card = (
          // The right card jumps a little after the check, as every right answer does.
          <RightBounce key={option.id} play={state === "correct"} delay={0.2} radius={OPTION.radius} className="flex min-w-0 flex-1">
            <div className="relative flex min-w-0 flex-1">
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
                // The side padding makes up the border's width (1px at rest, 4px picked), so a card is as wide either way.
                style={{ height: pictureCardHeight(options.length), borderRadius: OPTION.radius, paddingInline: state === "idle" ? padX - 1 : padX - 4 }}
                className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-visible ${RAISED} ${LOOKS[state].edge} ${
                  state === "idle" ? `border ${IDLE_LINE} ${option.tint ?? "bg-white dark:bg-[#15181E]"}` : `border-4 ${LOOKS[state].card}`
                }`}
              >
                {/* Three across hold every picture in the same box (a tall one, such as the traffic light, is fitted into it): the page's styles would otherwise give it the height its width asks for. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={option.icon} alt="" {...PICTURE_CARD.icon} style={three ? PICTURE_CARD.icon : undefined} draggable={false} className="select-none object-contain" />
                {/* Three across keep a two-line room for the words, so their pictures stand level whether the words take one line or two. */}
                <span className={`text-center font-semibold text-[#444444] dark:text-white ${three ? "flex min-h-10 items-center justify-center leading-5" : "leading-6"}`} style={{ fontSize: OPTION.font }}>
                  {option.text}
                </span>
                <PointedLook pointed={pointed} />
              </motion.button>
            </div>
          </RightBounce>
        );
        return bounceIn ? (
          <BounceIn key={option.id} index={index} shown={revealed} className="flex min-w-0">
            {card}
          </BounceIn>
        ) : (
          card
        );
      })}
    </div>
  );
}
