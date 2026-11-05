"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { ArrowUp, RotateCw } from "lucide-react";
import { COMMAND_LABEL, type Command } from "./hexGrid";

/** A command in the learner's list; `id` keeps a chip itself as the order changes. */
export type PlanItem = { id: number; command: Command };

const CHIP = { width: 80, height: 48 };
const GAP = 8;
const PER_ROW = 4;
/** A press that moves less than this far (px) is a tap, not a drag. */
const TAP_SLOP = 6;
/** A chip dropped within this far (px) of a place goes there. */
const REACH = 58;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

const placeOf = (index: number) => ({ x: (index % PER_ROW) * (CHIP.width + GAP), y: Math.floor(index / PER_ROW) * (CHIP.height + GAP) });

/** How big the list is when it holds up to `max` chips. */
export const chipListSize = (max: number) => ({
  width: PER_ROW * CHIP.width + (PER_ROW - 1) * GAP,
  height: Math.ceil(max / PER_ROW) * CHIP.height + (Math.ceil(max / PER_ROW) - 1) * GAP,
});

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
  disabled,
  onMove,
  onRemove,
}: {
  item: PlanItem;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const at = placeOf(index);
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

  return (
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
        if (Math.hypot(dx, dy) > TAP_SLOP) now.moved = true;
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
          const distance = Math.hypot(x.get() - placeOf(place).x, y.get() - placeOf(place).y);
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
      className={`pointer-events-auto absolute top-0 left-0 flex touch-none flex-col items-center justify-center gap-0.5 rounded-[10px] border-[3px] border-white shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] enabled:cursor-grab enabled:active:cursor-grabbing dark:border-transparent ${
        item.command === "forward" ? "bg-[#EDFAFE] dark:bg-[#15233A]" : "bg-[#FEF8EC] dark:bg-[#2A2218]"
      }`}
    >
      <span className="flex items-center gap-1">
        <span className="flex size-4 items-center justify-center rounded-full bg-[#D9DEE3] text-[10px] leading-none font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
          {index + 1}
        </span>
        {item.command === "forward" ? (
          <ArrowUp aria-hidden className="size-4 text-[#0F88E5]" strokeWidth={3} />
        ) : (
          <RotateCw aria-hidden className="size-4 text-[#E07B1F]" strokeWidth={3} />
        )}
      </span>
      <span className="text-[10px] leading-3 font-semibold tracking-[0.2px] text-[#444444] dark:text-white">{COMMAND_LABEL[item.command]}</span>
    </motion.button>
  );
}

/**
 * The learner's commands as numbered chips, four to a row. Drag a chip to
 * another place to move it there; tap it to take it out of the list.
 */
export function ChipList({
  items,
  disabled,
  onMove,
  onRemove,
}: {
  items: readonly PlanItem[];
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      {items.map((item, index) => (
        <Chip key={item.id} item={item} index={index} count={items.length} disabled={disabled} onMove={onMove} onRemove={onRemove} />
      ))}
    </>
  );
}
