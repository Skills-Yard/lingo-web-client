"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { DragCard } from "./interactions";
import { P } from "./pictures";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";

/** The cards' tints: they only tell the cards apart, they never say which ones belong together (screen 1's answer tiles use them too). */
export const TINTS = {
  blue: "bg-[#E5EFFD] dark:bg-[#15233A]",
  lavender: "bg-[#F6F4FE] dark:bg-[#0F1F26]",
  green: "bg-[#ECF7ED] dark:bg-[#10261A]",
  cream: "bg-[#FFF3DE] dark:bg-[#2A2218]",
} as const;

export type GroupTint = keyof typeof TINTS;
export type GroupItem = { id: string; label: string; tint: GroupTint };

/** The three groups, side by side as columns. */
const SLOTS = ["a", "b", "c"] as const;
type SlotId = (typeof SLOTS)[number];

/** Where a card was put, kept in the order they were put (a record would sort "12" and "25" ahead of the names). */
type Placement = { id: string; slot: SlotId };

/** A card, as the design has it: 104 x 52, a 4px white edge, Poppins 600 16px. */
export const CARD_LOOK = "flex h-[52px] w-[104px] items-center justify-center rounded-[8px] border-4 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)]";
/** The columns stand under the cards' own three columns, the same width and gap. */
const COLUMNS = "grid grid-cols-[repeat(3,104px)] gap-[14px]";
/** How far from a column a drop still counts for it (px): half a gap each side, and room above (within the gap under the grid) and under its pile. */
const DROP_SLACK = { x: 7, top: 10, bottom: 48 } as const;

const CARD_H = 52;
/** How much of each card shows above the one in front of it (px). */
const STEP = 36;
/** The columns are at least as tall as a pile of this many cards (an even share of the nine), so the first few cards never move the screen about. */
const MIN_PILE = 3;
/** A card behind another shows only its top strip: its label moves up, from the middle of the card to the middle of that strip. */
const LABEL_BEHIND_SHIFT = STEP / 2 - CARD_H / 2;
const PILE_SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

/**
 * Grouping with no right answer ("Let's find similar ones!"): nine cards stand in
 * a 3 x 3 grid above three columns, and the learner drags them (or taps a card,
 * then a column) into whichever groups they think fit. A group takes as many cards
 * as the learner likes (even all nine, or none). A group is a pile, not a queue: a
 * card put in a column lands in front at its foot, and the ones already there slide
 * up behind it, each showing its label (in the order they came). The columns grow
 * with the biggest pile. A tap on a card takes it out again. It is done when every
 * card is in a column (the empty grid then folds away); nothing is marked, and
 * `onSorted` is told how they were grouped.
 */
export function GroupStage({
  api,
  items,
  onSorted,
}: {
  api: InteractionApi;
  items: readonly GroupItem[];
  /** Told how the cards ended up (card id to slot id). */
  onSorted?: (placed: Readonly<Record<string, string>>) => void;
}) {
  const { done, finished } = api;
  const [placements, setPlacements] = useState<readonly Placement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const slotEls = useRef<Record<string, HTMLDivElement | null>>({});
  const placed = useMemo(() => Object.fromEntries(placements.map(({ id, slot }) => [id, slot])), [placements]);
  const all = items.every((item) => item.id in placed);
  // All three columns share one height: that of the biggest pile (at least a pile of MIN_PILE), so their empty slots stay level.
  const biggestPile = Math.max(MIN_PILE, ...SLOTS.map((slot) => placements.filter((placement) => placement.slot === slot).length));
  const columnHeight = CARD_H + (biggestPile - 1) * STEP;

  useEffect(() => {
    if (!all) return;
    const timer = window.setTimeout(() => {
      onSorted?.(placed);
      done();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [all, done, onSorted, placed]);

  const place = (id: string, slot: SlotId) => {
    if (finished) return;
    playClickSound();
    vibrateForTap();
    setSelected(null);
    setPlacements((now) => [...now.filter((placement) => placement.id !== id), { id, slot }]);
  };

  const takeOut = (id: string) => setPlacements((now) => now.filter((placement) => placement.id !== id));

  const slotAt = (clientX: number, clientY: number) =>
    SLOTS.find((slot) => {
      const rect = slotEls.current[slot]?.getBoundingClientRect();
      return (
        !!rect &&
        clientX >= rect.left - DROP_SLACK.x &&
        clientX <= rect.right + DROP_SLACK.x &&
        clientY >= rect.top - DROP_SLACK.top &&
        clientY <= rect.bottom + DROP_SLACK.bottom
      );
    });

  return (
    // The design starts its first row 8px higher than the room under Hex's line does.
    <div className="pointer-events-auto -mt-2 flex w-[360px] flex-col items-center">
      {/* Once every card is in a column the empty grid folds away, so tall columns have the room. It stays open until then, clipping nothing a card is dragged over. */}
      <motion.div initial={false} animate={{ height: all ? 0 : "auto" }} transition={{ duration: 0.35, ease: "easeInOut" }} style={{ overflow: all ? "hidden" : "visible" }}>
        {/* The columns start just under the grid, with their empty slots at their foot. */}
        <div className={`${COLUMNS} pb-3`}>
          {items.map((item) => (
            // Each card keeps its own place in the grid: one taken away leaves a gap, the others don't move.
            <div key={item.id} className="h-[52px] w-[104px]">
              <AnimatePresence>
                {!(item.id in placed) && (
                  <motion.div key={item.id} initial={false} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
                    <DragCard
                      label={item.label}
                      disabled={finished}
                      onTap={() => {
                        playClickSound();
                        setSelected((now) => (now === item.id ? null : item.id));
                      }}
                      onDrop={(clientX, clientY) => {
                        const slot = slotAt(clientX, clientY);
                        if (slot) place(item.id, slot);
                      }}
                      className={`${CARD_LOOK} ${TINTS[item.tint]} ${selected === item.id ? "border-[#5B9BFF]" : "border-white dark:border-transparent"}`}
                    >
                      <span className="text-[16px] leading-[110%] font-semibold text-[#444444] dark:text-white">{item.label}</span>
                    </DragCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      <div className={`${COLUMNS} items-start`}>
        {SLOTS.map((slot, index) => {
          const inside = placements.filter((placement) => placement.slot === slot).flatMap((placement) => items.filter((item) => item.id === placement.id));
          const empty = inside.length === 0;
          // Every group lights up for a picked card.
          const receiving = selected !== null;
          return (
            <motion.div
              key={slot}
              ref={(element) => {
                slotEls.current[slot] = element;
              }}
              role="group"
              aria-label={`Group ${index + 1}`}
              onClick={() => selected && place(selected, slot)}
              animate={{ height: columnHeight }}
              transition={{ duration: 0.2 }}
              className={`relative w-[104px] rounded-[12px] transition-colors ${
                receiving ? "cursor-pointer bg-[#EAF2FE]/70 outline-2 outline-offset-2 outline-[#5B9BFF] outline-dashed dark:bg-white/10" : ""
              }`}
              initial={false}
            >
              {/* An empty group is a gray slot at the column's foot, where its first card will land. */}
              {empty && (
                <div className="absolute inset-x-0 bottom-0 flex h-[52px] items-center justify-center rounded-[8px] border-[3px] border-b-4 border-[#C4C4C4] bg-[#F0F0F0] shadow-[inset_0_6px_6px_-3px_rgba(0,0,0,0.18)] dark:border-white/20 dark:bg-white/10">
                  <Pic src={P.dropSlot} className="h-6 w-6" />
                </div>
              )}
              <AnimatePresence>
                {inside.map((item, position) => {
                  // The newest card is in front at the foot; each older one is a step higher, behind the one after it.
                  const front = position === inside.length - 1;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      disabled={finished}
                      initial={{ scale: 0.6, opacity: 0, y: 0 }}
                      animate={{ scale: 1, opacity: 1, y: -(inside.length - 1 - position) * STEP }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={PILE_SPRING}
                      style={{ zIndex: position + 1 }}
                      onClick={(event) => {
                        // With a card picked, a tap anywhere in the column puts it there; otherwise a tap takes this one out.
                        if (selected) return;
                        event.stopPropagation();
                        takeOut(item.id);
                      }}
                      aria-label={`${item.label} (tap to take out)`}
                      className={`${CARD_LOOK} ${TINTS[item.tint]} pointer-events-auto absolute bottom-0 left-0 border-white enabled:cursor-pointer dark:border-transparent`}
                    >
                      {/* A card behind another shows only its top strip, so its label moves up into it. */}
                      <motion.span
                        initial={false}
                        animate={{ y: front ? 0 : LABEL_BEHIND_SHIFT }}
                        transition={PILE_SPRING}
                        className="text-[16px] leading-[110%] font-semibold text-[#444444] dark:text-white"
                      >
                        {item.label}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
