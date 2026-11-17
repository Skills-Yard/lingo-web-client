"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { RAISED_DRAG } from "@/components/ui/raised";
import { ArrowUp, RotateCw, X } from "lucide-react";
import { COMMAND_LABEL, type Command } from "./hexGrid";

/** A command in the learner's list; `id` keeps a chip itself as the order changes. */
export type PlanItem = { id: number; command: Command };

const CHIP = { width: 80, height: 80 };
const GAP = 8;
/** At most this many places to a row; more go on evenly shared rows. */
const MAX_PER_ROW = 4;
/** A press that moves less than this far (px) is a tap, not a drag. */
const TAP_SLOP = 6;
/** A chip dropped within this far (px) of a place goes there. */
const REACH = 70;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

/** How the `max` places are laid out: rows as even as they can be (5 is 3 + 2). */
const rowsFor = (max: number) => {
  const rows = Math.ceil(max / MAX_PER_ROW);
  return { rows, perRow: Math.ceil(max / rows) };
};

/** Where place `index` of `max` stands; a shorter last row is centred. */
const placeOf = (index: number, max: number) => {
  const { perRow } = rowsFor(max);
  const row = Math.floor(index / perRow);
  const inRow = Math.min(perRow, max - row * perRow);
  const offset = ((perRow - inRow) * (CHIP.width + GAP)) / 2;
  return { x: offset + (index % perRow) * (CHIP.width + GAP), y: row * (CHIP.height + GAP) };
};

/** How big the list is when it holds up to `max` chips. */
export const chipListSize = (max: number) => {
  const { rows, perRow } = rowsFor(max);
  return { width: perRow * CHIP.width + (perRow - 1) * GAP, height: rows * CHIP.height + (rows - 1) * GAP };
};

/** `items` with the one at `from` taken out and put back at `to`. */
export const moveItem = <T,>(items: readonly T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/** One chip: dragged by hand (the stage is scaled, so the pointer's px are converted), tapped to take out. */
function Chip({
  item,
  index,
  count,
  max,
  disabled,
  onMove,
  onRemove,
}: {
  item: PlanItem;
  index: number;
  count: number;
  max: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const at = placeOf(index, max);
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, SPRING), animate(y, at.y, SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  const home = () => {
    animate(x, at.x, SPRING);
    animate(y, at.y, SPRING);
  };

  // What is on the chip (its arrow and its word).
  const glyph = (
    <>
      {item.command === "forward" ? (
        <ArrowUp aria-hidden className="size-7 shrink-0 text-[#0F88E5]" strokeWidth={3} />
      ) : (
        <RotateCw aria-hidden className="size-7 shrink-0 text-[#E07B1F]" strokeWidth={3} />
      )}
      <span className="text-center text-[10px] leading-3 font-semibold tracking-[0.2px] text-[#444444] uppercase dark:text-white">{COMMAND_LABEL[item.command]}</span>
    </>
  );

  return (
    <>
    {/* The chip's shadow in its place: a plain shape the size of the chip, with nothing in it, there from the start behind the chip (which covers it, and which it appears with), so it is already showing when the chip is dragged away and stays in its place while the chip is away. It follows the chip's place when the list reorders. */}
    <motion.span
      aria-hidden
      initial={{ opacity: 0, left: at.x, top: at.y }}
      animate={{ opacity: 1, left: at.x, top: at.y }}
      transition={{ opacity: { duration: 0.2 }, left: SPRING, top: SPRING }}
      className="pointer-events-none absolute rounded-[10px]"
      style={{ width: CHIP.width, height: CHIP.height, zIndex: 0, backgroundColor: "rgba(0,0,0,0.09)" }}
    />
    <motion.button
      type="button"
      layout={false}
      disabled={disabled}
      aria-label={`${index + 1}. ${COMMAND_LABEL[item.command]} (tap to remove)`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: dragging ? 1.06 : 1, opacity: 1 }}
      onPointerDown={(event) => {
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        drag.current = {
          startX: event.clientX,
          startY: event.clientY,
          fromX: x.get(),
          fromY: y.get(),
          scale: box.getBoundingClientRect().width / box.offsetWidth || 1,
          moved: false,
        };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const now = drag.current;
        if (!now) return;
        const dx = event.clientX - now.startX;
        const dy = event.clientY - now.startY;
        if (!now.moved && Math.hypot(dx, dy) > TAP_SLOP) now.moved = true;
        x.set(now.fromX + dx / now.scale);
        y.set(now.fromY + dy / now.scale);
      }}
      onPointerUp={() => {
        const now = drag.current;
        drag.current = null;
        setDragging(false);
        if (!now) return;
        if (!now.moved) return onRemove(index);
        let nearest = index;
        let nearestDistance = Infinity;
        for (let place = 0; place < count; place += 1) {
          const target = placeOf(place, max);
          const distance = Math.hypot(x.get() - target.x, y.get() - target.y);
          if (distance < nearestDistance) {
            nearest = place;
            nearestDistance = distance;
          }
        }
        if (nearestDistance <= REACH && nearest !== index) onMove(index, nearest);
        else home();
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        home();
      }}
      style={{ x, y, width: CHIP.width, height: CHIP.height, zIndex: dragging ? 2 : 1 }}
      className={`group pointer-events-auto absolute top-0 left-0 flex touch-none flex-col items-center justify-center gap-1 rounded-[10px] border-[3px] border-white px-1 ${RAISED_DRAG} enabled:cursor-grab enabled:active:cursor-grabbing dark:border-[#818185] ${
        item.command === "forward" ? "bg-[#EDFAFE] [--edge:#BFE6F2] dark:bg-[#15233A]" : "bg-[#FEF8EC] [--edge:#F2DFB8] dark:bg-[#2A2218]"
      }`}
    >
      {/* Its place in the order, on the corner, as on the command cards. */}
      <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#D9DEE3] text-[10px] leading-none font-semibold text-[#5C6670] dark:border-[#818185] dark:bg-[#3A3F47] dark:text-white">
        {index + 1}
      </span>
      {/* Says a tap takes it out. */}
      {!disabled && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#9AA3AE] text-white dark:bg-white/40">
          <X aria-hidden className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
      {glyph}
    </motion.button>
    </>
  );
}

/**
 * The learner's commands as numbered chips, four to a row, over `max` numbered
 * outlines that show where the next one goes. Drag a chip to another place to
 * move it there; tap it to take it out of the list.
 */
export function ChipList({
  items,
  max,
  disabled,
  onMove,
  onRemove,
}: {
  items: readonly PlanItem[];
  max: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      {/* The empty places, as on "Something went wrong!": numbered wells. */}
      {Array.from({ length: max }, (_, index) => (
        <div
          key={`place-${index}`}
          aria-hidden
          className="absolute flex items-center justify-center rounded-[10px] border-2 border-[#D9DEE3] bg-[#EEF1F4] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] dark:border-white/20 dark:bg-white/10"
          style={{ left: placeOf(index, max).x, top: placeOf(index, max).y, width: CHIP.width, height: CHIP.height }}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-[#D9DEE3] text-[15px] font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
            {index + 1}
          </span>
        </div>
      ))}
      {items.map((item, index) => (
        <Chip key={item.id} item={item} index={index} count={items.length} max={max} disabled={disabled} onMove={onMove} onRemove={onRemove} />
      ))}
    </>
  );
}
