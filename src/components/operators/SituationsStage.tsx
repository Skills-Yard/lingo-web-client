"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SeenBadge } from "./FlipCarousel";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";

/** The pastel a card is set on, to go with its icon. */
export type SituationTint = "lavender" | "cream" | "mint" | "blue";

/** A situation: its icon, and its name in two lines (the action over the thing). */
export type SituationItem = { id: string; icon: string; verb: string; thing: string; tint: SituationTint };

/** Hex has started his line; the card is picked out this long after the stage opens (ms). */
const HIGHLIGHT_MS = 500;
/** The picked-out card grows a little, so the highlight reads at a glance. */
export const CURRENT_SCALE = 1.04;

export const TINT: Record<SituationTint, string> = {
  lavender: "bg-[#F4F1FF] dark:bg-[#1F1B3A]",
  cream: "bg-[#FFF6EA] dark:bg-[#3A2C14]",
  mint: "bg-[#EBF6F0] dark:bg-[#0F2B28]",
  blue: "bg-[#E6F0FF] dark:bg-[#15213A]",
};
export const EDGE_IDLE = "border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent";
export const EDGE_CURRENT = "border-[#08A4AD] shadow-[0_0_0_3px_rgba(8,164,173,0.18),0_6px_16px_rgba(8,164,173,0.25)]";

/**
 * The timing of a card's turn: the card is picked out a moment after the stage
 * opens (while Hex speaks), and the main button then goes on to the question,
 * once Hex has said his line. Returns whether the card is picked out.
 */
export function useTurn({ lineTyped = true, holdButton, next }: InteractionApi) {
  const [lit, setLit] = useState(false);
  const goOn = useCallback(() => next?.(), [next]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLit(true), HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!holdButton || !lineTyped || !lit) return;
    holdButton(goOn);
    return () => holdButton(null);
  }, [holdButton, lineTyped, lit, goOn]);

  return lit;
}

/**
 * The situations of a screen as a grid of cards, not tapped: this stage is the
 * turn of one of them (`focus`). The cards before it carry a tick, and its own
 * card is picked out while Hex speaks. Continue then goes on to the stage
 * after this one, that card's own question. The screen puts one of these
 * before each question, so the cards are picked out one by one.
 */
export function SituationsStage({ api, situations, focus }: { api: InteractionApi; situations: readonly SituationItem[]; /** The card whose turn it is. */ focus: number }) {
  const lit = useTurn(api);

  return (
    <div className="pointer-events-auto grid w-[340px] grid-cols-2 gap-3">
      {situations.map((situation, index) => {
        const current = lit && index === focus;
        return (
          <motion.div
            key={situation.id}
            // The first turn brings the cards in; the later ones find them already there.
            initial={focus === 0 ? { opacity: 0, y: 16, scale: 0.96 } : false}
            animate={{ opacity: 1, y: 0, scale: current ? CURRENT_SCALE : 1 }}
            transition={{ duration: 0.35, delay: focus === 0 ? index * 0.08 : 0, scale: { type: "spring", stiffness: 320, damping: 22 } }}
            className={`relative flex h-[150px] flex-col items-center justify-center gap-2.5 rounded-[10px] border-4 px-2 py-2 transition-[border-color,box-shadow] duration-200 ${TINT[situation.tint]} ${current ? EDGE_CURRENT : EDGE_IDLE}`}
          >
            <Pic src={situation.icon} className="h-[76px] w-[100px]" />
            <span className="text-center text-[14px] leading-[18px] font-bold text-[#444444] dark:text-white">
              {situation.verb}
              <br />
              {situation.thing}
            </span>
            {index < focus && <SeenBadge className="top-1.5 right-1.5" />}
          </motion.div>
        );
      })}
    </div>
  );
}
