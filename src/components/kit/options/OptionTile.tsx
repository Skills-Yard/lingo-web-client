"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { SlotImage } from "@/components/level-two/SlotImage";
import { feelTap } from "../feel";
import { RAISED } from "@/components/ui/raised";
import { HINT_FILL, STATE_CARD, STATE_EDGE, tintClass, WRONG_SHAKE } from "../tokens";
import type { OptionData, OptionState } from "../types";

/** How big a tile is: the card's height, the picture's box, the text's size. */
export const TILE_SIZE = {
  /** Two big cards side by side. */
  pair: { card: "h-[184px]", picture: "h-[83px] w-[95px]", text: "text-[16px] leading-none", gap: "gap-3.5" },
  /** Three small tiles in a row. */
  three: { card: "h-[110px]", picture: "h-[46px] w-full", text: "text-[16px] leading-5", gap: "gap-2" },
  /** Four tiles, two across and two down. */
  grid: { card: "h-[104px]", picture: "h-[48px] w-[56px]", text: "text-[15px] leading-5", gap: "gap-1.5" },
  /** Two very big cards with a large picture. */
  cards: { card: "h-[221px]", picture: "size-[116px]", text: "text-[20px] leading-6 max-w-[120px]", gap: "gap-3.5" },
} as const;

export type TileSize = keyof typeof TILE_SIZE;

export type OptionTileProps = {
  option: OptionData;
  size: TileSize;
  state?: OptionState;
  hinted?: boolean;
  /** Draws this in place of the option's picture (an icon, a number). */
  media?: ReactNode;
  /** A wrong tile shakes from side to side (answers that check each tap at once). */
  shake?: boolean;
  disabled?: boolean;
  onPick?: (id: string) => void;
};

/** One answer as a square-ish card: the picture over the words. */
export function OptionTile({ option, size, state = "idle", hinted = false, media, shake = false, disabled = false, onPick }: OptionTileProps) {
  const look = TILE_SIZE[size];
  return (
    <HintFloat className="relative flex min-w-0 flex-1" spin={false} active={hinted}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => {
          feelTap();
          onPick?.(option.id);
        }}
        aria-pressed={state === "selected"}
        animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1, x: shake && state === "wrong" ? WRONG_SHAKE : 0 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`pointer-events-auto relative isolate flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[8px] border-4 px-1.5 ${RAISED} ${STATE_EDGE[state]} enabled:cursor-pointer ${look.card} ${look.gap} ${
          state === "idle" ? `border-white dark:border-transparent ${tintClass(option.tint)}` : STATE_CARD[state]
        }`}
      >
        {/* The hint's orange fill, wiped in from the left behind the content. */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ clipPath: hinted ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
          transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
          className={`pointer-events-none absolute inset-0 -z-10 ${HINT_FILL}`}
        />
        {(media || option.image) && (
          <span className={`flex shrink-0 items-center justify-center ${look.picture}`}>
            {media ?? <SlotImage file={option.image!} className="max-h-full max-w-full object-contain" />}
          </span>
        )}
        <span className={`text-center font-semibold text-[#444444] dark:text-white ${look.text}`}>
          {option.text}
          {option.sub && <span className="block text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{option.sub}</span>}
        </span>
      </motion.button>
    </HintFloat>
  );
}
