"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";

/** A card to drag: `kind` is what it is (two cards can be the same kind), `id` which one it is. */
export type ArrangeCardDef = { id: string; kind: string; text: string; art?: ReactNode; tint: string };

type Point = { x: number; y: number };

/** The slots, first slot first; `null` is an open one, else the id of the card in it. */
export type Slots = readonly (string | null)[];

type ArrangeLayout = {
  /** `columns`: the cards in a column with the slots in a column beside it; `rows`: the cards in a row with the slots in a row under it. */
  mode: "columns" | "rows";
  card: { width: number; height: number };
  /** How many cards, and so slots. */
  count: number;
  /** The gap (px) between one card and the next. */
  gap?: number;
  /** The gap (px) between the cards and the slots. */
  lane?: number;
  /** The cards start in a tray of their own; without it they start in their slots (they can only be swapped). */
  tray?: boolean;
  /** The cards' text is a sentence: set in plain case, not the small capitals of a command's name. */
  sentence?: boolean;
};

/** Where everything stands on the board, and how big the board is. */
export const arrangeGeometry = ({ mode, card, count, gap = 12, lane = mode === "columns" ? 32 : 16, tray = true, sentence = false }: ArrangeLayout) => {
  const columns = mode === "columns";
  const home = (index: number): Point => (columns ? { x: 0, y: index * (card.height + gap) } : { x: index * (card.width + gap), y: 0 });
  const slot = (index: number): Point =>
    columns
      ? { x: tray ? card.width + lane : 0, y: index * (card.height + gap) }
      : { x: index * (card.width + gap), y: tray ? card.height + lane : 0 };
  const board = columns
    ? { width: tray ? card.width * 2 + lane : card.width, height: count * card.height + (count - 1) * gap }
    : { width: count * card.width + (count - 1) * gap, height: tray ? card.height * 2 + lane : card.height };
  /** A card dropped within this far (px) of a slot's corner goes in it. */
  const reach = card.height * 0.87;
  return { count, card, tray, home, slot, board, reach, sentence };
};
export type ArrangeGeometry = ReturnType<typeof arrangeGeometry>;

/** Below this far (px) a press and release is a tap, not a drag. */
const TAP_SLOP = 6;
const CARD_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/** The slot a card dropped with its corner at `at` lands in, if any. */
const slotAt = (at: Point, geo: ArrangeGeometry) => {
  let nearest = -1;
  let nearestDistance = Infinity;
  for (let index = 0; index < geo.count; index += 1) {
    const slot = geo.slot(index);
    const distance = Math.hypot(at.x - slot.x, at.y - slot.y);
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  }
  return nearestDistance <= geo.reach ? nearest : null;
};

/**
 * The cards and their slots, the state held by `useArrange`: drag a card into a
 * slot, or tap it to send it to the first open slot (and back out again).
 */
export function useArrange(ids: readonly string[], count: number, initial?: Slots) {
  const start = (): Slots => initial ?? Array.from({ length: count }, () => null);
  const [slots, setSlots] = useState<Slots>(start);

  const placeIn = (id: string, slot: number | null) => {
    playClickSound();
    vibrateForTap();
    setSlots((now) => {
      const from = now.indexOf(id);
      const next = [...now];
      if (from >= 0) next[from] = null;
      if (slot !== null) {
        // A card already there takes the place this one came from, or goes home.
        if (from >= 0) next[from] = now[slot];
        next[slot] = id;
      }
      return next;
    });
  };

  const tapCard = (id: string) => {
    if (slots.includes(id)) return placeIn(id, null);
    const open = slots.indexOf(null);
    if (open >= 0 && ids.includes(id)) placeIn(id, open);
  };

  return { slots, placeIn, tapCard, reset: () => setSlots(start()), full: slots.every((slot) => slot !== null) };
}

/**
 * Follows the pointer by hand: the stage is scaled as one piece, so the pointer's
 * screen px are converted to the stage's, which a library's drag doesn't do.
 */
function ArrangeCard({
  card,
  size,
  sentence,
  at,
  disabled,
  onDrop,
  onTap,
}: {
  card: ArrangeCardDef;
  size: { width: number; height: number };
  sentence: boolean;
  at: Point;
  disabled: boolean;
  onDrop: (to: Point) => void;
  onTap?: () => void;
}) {
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const compact = size.height < 80;

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, CARD_SPRING), animate(y, at.y, CARD_SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={card.text}
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
        if (now.moved) onDrop({ x: x.get(), y: y.get() });
        else onTap?.();
        // Back to its place if nothing changed; a move gets here through `at`.
        animate(x, at.x, CARD_SPRING);
        animate(y, at.y, CARD_SPRING);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        animate(x, at.x, CARD_SPRING);
        animate(y, at.y, CARD_SPRING);
      }}
      animate={{ scale: dragging ? 1.05 : 1 }}
      style={{ x, y, width: size.width, height: size.height, zIndex: dragging ? 2 : 1 }}
      className={`pointer-events-auto absolute top-0 left-0 flex touch-none flex-col items-center justify-center rounded-[8px] border-4 border-white px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] enabled:cursor-grab enabled:active:cursor-grabbing dark:border-transparent ${compact ? "gap-0.5" : "gap-1.5"} ${card.tint}`}
    >
      {card.art && (
        <span className={`flex w-full items-center justify-center ${compact ? "h-[24px]" : "h-[46px]"}`}>{card.art}</span>
      )}
      <span
        className={`text-center font-semibold text-[#444444] dark:text-white ${
          compact ? (sentence ? "text-[12px] leading-4" : "text-[11px] leading-[14px] tracking-[0.2px] uppercase") : "text-[14px] leading-[18px]"
        }`}
      >
        {card.text}
      </span>
    </motion.button>
  );
}

/** The numbered slots and the cards: it fills its (sized) dock. */
export function ArrangeBoard({
  cards,
  slots,
  geo,
  disabled,
  onPlace,
  onTap,
  slotContent,
}: {
  cards: readonly ArrangeCardDef[];
  slots: Slots;
  geo: ArrangeGeometry;
  disabled: boolean;
  onPlace: (id: string, slot: number | null) => void;
  /** Tapping a card; without it a tap does nothing (cards that can only be swapped). */
  onTap?: (id: string) => void;
  /** What an empty slot shows in place of its number (its card, when it holds one, is drawn over it). */
  slotContent?: (index: number) => ReactNode;
}) {
  return (
    <>
      {Array.from({ length: geo.count }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className="absolute flex items-center justify-center rounded-[8px] border-2 border-dashed border-[#9AA3AE] bg-white/70 dark:border-white/30 dark:bg-white/5"
          style={{ left: geo.slot(index).x, top: geo.slot(index).y, width: geo.card.width, height: geo.card.height }}
        >
          {slotContent ? (
            slotContent(index)
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-[#D9DEE3] text-[15px] font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
              {index + 1}
            </span>
          )}
        </div>
      ))}
      {cards.map((card, index) => {
        const placed = slots.indexOf(card.id);
        return (
          <ArrangeCard
            key={card.id}
            card={card}
            size={geo.card}
            sentence={geo.sentence}
            at={placed >= 0 ? geo.slot(placed) : geo.home(index)}
            disabled={disabled}
            onDrop={(to) => onPlace(card.id, slotAt(to, geo))}
            onTap={onTap ? () => onTap(card.id) : undefined}
          />
        );
      })}
    </>
  );
}

/**
 * Stands the board on the button row. `rise` lifts it clear of the result panel;
 * `fade` clears it so what is behind can be seen.
 */
export function ArrangeDock({
  geo,
  withHint = false,
  rise = 0,
  fade = false,
  children,
}: {
  geo: ArrangeGeometry;
  withHint?: boolean;
  rise?: number;
  fade?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={false}
      animate={{ y: -rise, opacity: fade ? 0 : 1 }}
      transition={PANEL_SPRING}
      className="absolute left-1/2 z-[1]"
      style={{ bottom: aboveButtons(28, withHint), width: geo.board.width, height: geo.board.height, marginLeft: -geo.board.width / 2 }}
    >
      {children}
    </motion.div>
  );
}
