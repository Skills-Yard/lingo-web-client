"use client";

import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
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
} as const;

type TileCardsProps = {
  layout: "pair" | "tiles" | "grid";
  choices: readonly Choice[];
  correctId: string;
  selectedId: string | null;
  checked: boolean;
  /** The cards fade out completely, so the robot's move behind them can be seen. */
  fadeOut: boolean;
  hinted: boolean;
  withHint: boolean;
  /** The text is a sentence: set smaller and left to wrap. */
  longText?: boolean;
  /** The picture box's width (px), where the art is wider than the layout's. */
  pictureWidth?: number;
  /** The picture box's height (px), where the art should be larger than the layout's. */
  pictureHeight?: number;
  /** The card's height (px), where it should differ from the layout's. */
  cardHeight?: number;
  /** The cards bounce in one by one instead of the whole row rising together. */
  bounceIn?: boolean;
  /** With `bounceIn`: they stay hidden until this turns on (default: at once). */
  revealed?: boolean;
  onPick: (id: string) => void;
};

/**
 * The answers as cards side by side — two big ones or three small tiles — in
 * the same column as the rest of the screen (`SIDE_MARGIN` in from each side), standing on the button row.
 * Like the list, they rise once the result panel is up.
 */
export function TileCards({ layout, choices, correctId, selectedId, checked, fadeOut, hinted, withHint, longText, pictureWidth, pictureHeight, cardHeight, bounceIn = false, revealed = true, onPick }: TileCardsProps) {
  const look = LAYOUT[layout];
  return (
    <motion.div
      initial={bounceIn ? false : { opacity: 0, y: 90 }}
      animate={{ opacity: 1, y: checked ? -CARDS_RISE : 0 }}
      transition={
        checked
          ? PANEL_SPRING
          : { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } }
      }
      className={`pointer-events-auto absolute z-[1] ${look.box}`}
      style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, withHint), left: COLUMN_LEFT, width: COLUMN_W }}
    >
      {choices.map((choice, index) => {
        const state = optionState(choice.id, selectedId, checked, correctId);
        const hintHere = hinted && selectedId === null && choice.id === correctId;
        const card = (
          <HintFloat key={choice.id} className="relative flex min-w-0 flex-1" spin={false} active={hintHere}>
            <motion.button
              type="button"
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
              className={`relative isolate flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center ${look.inner} overflow-hidden rounded-[8px] border-4 px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] ${look.card} ${
                state === "idle" ? `border-white dark:border-transparent ${choice.tint ?? "bg-white"}` : LOOKS[state].card
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
              <span className={`flex shrink-0 items-center justify-center ${look.picture}`} style={{ width: pictureWidth, height: pictureHeight }}>
                <SlotImage file={choice.icon} className={pictureHeight ? "h-full w-full object-contain" : "max-h-full max-w-full object-contain"} />
              </span>
              <span
                className={`text-center font-semibold text-[#444444] dark:text-white ${look.text} ${longText ? "text-[15px]! leading-5!" : ""}`}
              >
                {choice.text}
              </span>
            </motion.button>
          </HintFloat>
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
