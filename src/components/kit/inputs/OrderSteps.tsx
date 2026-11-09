"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { GripVertical } from "lucide-react";
import { SlotImage } from "@/components/level-two/SlotImage";
import { AnswerMark } from "../feedback/AnswerMark";
import { STATE_CARD } from "../tokens";

export type OrderItem = { id: string; text: string; image?: string };

const ROW_H = 56;
const GAP = 8;
const PITCH = ROW_H + GAP;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

/** `items` with the one at `from` taken out and put back at `to`. */
const moved = <T,>(items: readonly T[], from: number, to: number): T[] => {
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
};

function Row({
  item,
  index,
  count,
  status,
  disabled,
  onMoveTo,
}: {
  item: OrderItem;
  index: number;
  count: number;
  status: "idle" | "correct" | "wrong";
  disabled: boolean;
  onMoveTo: (from: number, to: number) => void;
}) {
  const slot = index * PITCH;
  const y = useMotionValue(slot);
  const drag = useRef<{ pointerY: number; startY: number; scale: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Settles into its place whenever its place changes — unless a hand is holding it.
  useEffect(() => {
    if (drag.current) return;
    const animation = animate(y, slot, SPRING);
    return () => animation.stop();
  }, [slot, y]);

  const release = () => {
    drag.current = null;
    setDragging(false);
    animate(y, slot, SPRING);
  };

  return (
    <motion.div
      role="listitem"
      aria-label={`${index + 1}. ${item.text}`}
      onPointerDown={(event) => {
        if (disabled) return;
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        // The stage is scaled, so the pointer's pixels are turned into the row's own.
        drag.current = { pointerY: event.clientY, startY: y.get(), scale: box.getBoundingClientRect().height / box.offsetHeight || 1 };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const now = drag.current;
        if (!now) return;
        const next = Math.max(0, Math.min((count - 1) * PITCH, now.startY + (event.clientY - now.pointerY) / now.scale));
        y.set(next);
        const to = Math.round(next / PITCH);
        if (to !== index) onMoveTo(index, to);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      animate={{ scale: dragging ? 1.03 : 1 }}
      style={{ y, height: ROW_H, zIndex: dragging ? 2 : 1 }}
      className={`pointer-events-auto absolute inset-x-0 top-0 flex touch-none items-center gap-3 rounded-[14px] border px-3 shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] select-none ${disabled ? "" : "cursor-grab active:cursor-grabbing"} ${
        status === "idle" ? "border-black/4 bg-white dark:border-[#818185] dark:bg-[#15181E]" : STATE_CARD[status]
      }`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#D9DEE3] text-[13px] font-semibold text-[#5C6670] dark:bg-[#3A3F47] dark:text-white">{index + 1}</span>
      {item.image && (
        <span className="flex size-9 shrink-0 items-center justify-center">
          <SlotImage file={item.image} className="max-h-full max-w-full object-contain" />
        </span>
      )}
      <span className="min-w-0 flex-1 text-[14px] leading-5 font-medium text-[#444444] dark:text-white">{item.text}</span>
      {status === "idle" ? !disabled && <GripVertical aria-hidden className="size-5 shrink-0 text-[#9AA3AE] dark:text-white/40" /> : <AnswerMark kind={status} size={24} />}
    </motion.div>
  );
}

export type OrderStepsProps = {
  /** The items in the order they are in now. */
  items: readonly OrderItem[];
  /** Called with the new order (the ids) as an item is dragged past another. */
  onChange: (ids: string[]) => void;
  /** The order has been checked: each row is marked right or wrong, and nothing can be moved. */
  checked?: boolean;
  /** The right order (the ids). */
  correctOrder?: readonly string[];
  disabled?: boolean;
  className?: string;
};

/** "Put these in order": numbered rows to drag up and down. */
export function OrderSteps({ items, onChange, checked = false, correctOrder, disabled = false, className = "" }: OrderStepsProps) {
  const locked = disabled || checked;
  return (
    <div role="list" className={`relative w-full ${className}`} style={{ height: items.length * PITCH - GAP }}>
      {items.map((item, index) => (
        <Row
          key={item.id}
          item={item}
          index={index}
          count={items.length}
          disabled={locked}
          status={checked && correctOrder ? (correctOrder[index] === item.id ? "correct" : "wrong") : "idle"}
          onMoveTo={(from, to) => onChange(moved(items, from, to).map((entry) => entry.id))}
        />
      ))}
    </div>
  );
}
