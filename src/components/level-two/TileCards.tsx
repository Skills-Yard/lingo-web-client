"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { PointedLook } from "@/components/level-one/answerHint";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { RAISED } from "@/components/ui/raised";
import { CARDS_RISE, GAP_ABOVE_BUTTONS } from "./AnswerCards";
import { BounceIn } from "./BounceIn";
import { aboveButtons } from "./LevelTwoShell";
import { SlotImage } from "./SlotImage";
import { COLUMN_W } from "@/lib/questionColumn";
import { COLUMN_LEFT, type Choice } from "./levelTwo";

/** The result panel's own spring (see FeedbackPanel), so the cards rise as it arrives. */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/** Each layout's card height, the picture's box and the text's size. */
const LAYOUT = {
  pair: { card: "h-[184px]", picture: "h-[83px] w-[95px]", text: "text-[16px] leading-none", box: "flex items-stretch gap-3.5", inner: "gap-3.5" },
  tiles: { card: "h-[110px]", picture: "h-[46px] w-full", text: "text-[16px] leading-5", box: "flex items-stretch gap-3.5", inner: "gap-2" },
  /** Four answers, two across and two down. */
  grid: { card: "h-[104px]", picture: "h-[48px] w-[56px]", text: "text-[15px] leading-5", box: "grid grid-cols-2 gap-3.5", inner: "gap-1.5" },
  /** Four big answers, two across and two down, in a column of their own (`BIG_WIDTH`). */
  big: { card: "h-[184px]", picture: "h-[62px] w-[62px]", text: "text-[16px] leading-5", box: "grid grid-cols-2 gap-x-[29px] gap-y-[31px]", inner: "gap-3" },
  /** Three 112 x 119 cards, each a coloured badge over its word. */
  badges: { card: "h-[119px]", picture: "h-10 w-10", text: "text-[14px] leading-[120%]", box: "flex items-stretch gap-[11px]", inner: "gap-1.5" },
} as const;

/** The layouts that are wider than the usual column (px): they stand centred. */
const WIDTH: Partial<Record<keyof typeof LAYOUT, number>> = { big: 355, badges: 358 };

type TileCardsProps = {
  layout: keyof typeof LAYOUT;
  choices: readonly Choice[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out completely, so the robot's move behind them can be seen. */
  fadeOut: boolean;
  /** The card the hint's hand is on (see `useAnswerHint`): it takes a tint and a shine. */
  pointedId: string | null;
  withHint: boolean;
  /** The text is a sentence: set smaller and left to wrap. */
  longText?: boolean;
  /** The picture box's width (px), where the art is wider than the layout's. */
  pictureWidth?: number;
  /** The picture box's height (px), where the art should be larger than the layout's. */
  pictureHeight?: number;
  /** The card's height (px), where it should differ from the layout's. */
  cardHeight?: number;
  /** Stage px from the top, where the cards should stand there instead of on the button row; they still rise by `rise` once the result panel is up. */
  top?: number;
  /** The cards bounce in one by one instead of the whole row rising together. */
  bounceIn?: boolean;
  /** With `bounceIn`: they stay hidden until this turns on (default: at once). */
  revealed?: boolean;
  /** How far (px) above the button they stand (default `GAP_ABOVE_BUTTONS`). */
  bottomGap?: number;
  /** How far they rise once the result panel is up (default `CARDS_RISE`). */
  rise?: number;
  onPick: (id: string) => void;
};

/**
 * The answers as cards side by side — two big ones or three small tiles — in
 * the same column as the rest of the screen (`SIDE_MARGIN` in from each side), standing on the button row.
 * Like the list, they rise once the result panel is up.
 */
export function TileCards({ layout, choices, correctId, selectedId, checked, fadeOut, pointedId, withHint, longText, pictureWidth, pictureHeight, cardHeight, top, bounceIn = false, revealed = true, bottomGap = GAP_ABOVE_BUTTONS, rise = CARDS_RISE, onPick }: TileCardsProps) {
  const look = LAYOUT[layout];
  return (
    <motion.div
      initial={bounceIn ? false : { opacity: 0, y: 90 }}
      animate={{ opacity: 1, y: checked ? -rise : 0 }}
      transition={
        checked
          ? PANEL_SPRING
          : { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } }
      }
      className={`pointer-events-auto absolute z-[1] ${look.box}`}
      style={{ ...(top === undefined ? { bottom: aboveButtons(bottomGap, withHint) } : { top }), left: WIDTH[layout] ? `calc(50% - ${WIDTH[layout]! / 2}px)` : COLUMN_LEFT, width: WIDTH[layout] ?? COLUMN_W }}
    >
      {choices.map((choice, index) => {
        const state = optionState(choice.id, selectedId, checked, correctId);
        const pointed = pointedId === choice.id && state === "idle";
        const card = (
          <div key={choice.id} className="relative flex min-w-0 flex-1">
            <motion.button
              type="button"
              data-hint={choice.id}
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                onPick(choice.id);
              }}
              aria-pressed={state === "selected"}
              style={cardHeight ? { height: cardHeight } : undefined}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, opacity: fadeOut ? 0 : 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center ${look.inner} overflow-hidden rounded-[8px] border-4 px-1.5 ${RAISED} ${LOOKS[state].edge} ${look.card} ${
                state === "idle" ? `border-white dark:border-transparent ${choice.tint ?? "bg-white"}` : LOOKS[state].card
              }`}
            >
              {choice.tag ? (
                <span className={`flex shrink-0 items-center justify-center rounded-[12px] text-[20px] leading-[120%] font-semibold whitespace-nowrap ${look.picture} ${choice.tag.look}`}>{choice.tag.text}</span>
              ) : (
                <span className={`flex shrink-0 items-center justify-center ${look.picture}`} style={{ width: pictureWidth, height: pictureHeight }}>
                  <SlotImage file={choice.icon} className={pictureHeight ? "h-full w-full object-contain" : "max-h-full max-w-full object-contain"} />
                </span>
              )}
              <span
                className={`text-center font-semibold text-[#444444] dark:text-white ${look.text} ${longText ? "text-[15px]! leading-5!" : ""}`}
              >
                {choice.text}
              </span>
              <PointedLook pointed={pointed} />
            </motion.button>
          </div>
        );
        return bounceIn ? (
          <BounceIn key={choice.id} index={index} shown={revealed} className="flex min-w-0 flex-1">
            {card}
          </BounceIn>
        ) : (
          card
        );
      })}
    </motion.div>
  );
}
