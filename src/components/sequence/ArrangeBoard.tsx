"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { aboveButtons } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED_DRAG } from "@/components/ui/raised";
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
  /** In `rows`, the slots stand above the tray instead of under it. */
  slotsOnTop?: boolean;
  /** The slots are solid wells, not dashed outlines. */
  solidSlots?: boolean;
  /** The cards' text is a sentence: set in plain case, not the small capitals of a command's name. */
  sentence?: boolean;
  /** The cards' border, width and colour (Tailwind classes, light and dark): a 4px white one by default. */
  line?: string;
  /** The corner radius (px) of the cards and the slots: 8, so a thick border needs a larger one for the face inside it to keep rounded corners. */
  radius?: number;
  /** A card held (pressed or dragged) is pressed like a button: its face sinks onto its raised edge, instead of growing a little and keeping the edge. */
  sink?: boolean;
  /** The cards' text size (px), on a 20px line, in place of the size their height gives them (12px for a short card). */
  fontSize?: number;
};

/** Where everything stands on the board, and how big the board is. */
export const arrangeGeometry = ({ mode, card, count, gap = 12, lane = mode === "columns" ? 32 : 16, tray = true, slotsOnTop = false, solidSlots = false, sentence = false, line = "border-4 border-white dark:border-[#818185]", radius = 8, sink = false, fontSize }: ArrangeLayout) => {
  const columns = mode === "columns";
  const home = (index: number): Point => (columns ? { x: 0, y: index * (card.height + gap) } : { x: index * (card.width + gap), y: tray && slotsOnTop ? card.height + lane : 0 });
  const slot = (index: number): Point =>
    columns
      ? { x: tray ? card.width + lane : 0, y: index * (card.height + gap) }
      : { x: index * (card.width + gap), y: tray && !slotsOnTop ? card.height + lane : 0 };
  const board = columns
    ? { width: tray ? card.width * 2 + lane : card.width, height: count * card.height + (count - 1) * gap }
    : { width: count * card.width + (count - 1) * gap, height: tray ? card.height * 2 + lane : card.height };
  /** A card dropped within this far (px) of a slot's corner goes in it. */
  const reach = card.height * 0.87;
  return { count, card, tray, solidSlots, home, slot, board, reach, sentence, line, radius, sink, fontSize };
};
export type ArrangeGeometry = ReturnType<typeof arrangeGeometry>;

/** The look of a button held down (see `RAISED`): the face has sunk the edge's 4px and the edge is gone. It moves with `translate`, which sits beside the `transform` the drag sets. */
const PRESSED = "translate-y-1 shadow-[0_0_0_var(--edge)]";

/** Below this far (px) a press and release is a tap, not a drag. */
const TAP_SLOP = 6;
/** A pressed card (`sink`) stays pushed down at least this long (ms), so a quick tap still shows its 3D press. */
const MIN_PRESS_MS = 160;
/** A card picked by a tap looks like the module's picked answers: a 4px green border, a pale mint face and the green raised edge. */
const PICKED_LOOK = { borderWidth: 4, borderColor: "#01A17F", backgroundColor: "#F2FBF8", "--edge": "#008566" } as CSSProperties;
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
 * The card the hint points at: the one that belongs in the first slot that isn't
 * right yet, given the right `kinds`, first slot first. `null` once all are right.
 */
export const nextHintId = (cards: readonly ArrangeCardDef[], slots: Slots, kinds: readonly string[]) => {
  const kindOf = (id: string | null) => cards.find((card) => card.id === id)?.kind;
  const open = kinds.findIndex((kind, index) => kindOf(slots[index]) !== kind);
  if (open < 0) return null;
  const settled = slots.slice(0, open);
  return cards.find((card) => card.kind === kinds[open] && !settled.includes(card.id))?.id ?? null;
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
  line,
  radius,
  sink,
  fontSize,
  at,
  disabled,
  hinted,
  selected,
  onDrop,
  onTap,
}: {
  card: ArrangeCardDef;
  size: { width: number; height: number };
  sentence: boolean;
  line: string;
  radius: number;
  sink: boolean;
  fontSize?: number;
  at: Point;
  disabled: boolean;
  hinted: boolean;
  /** Picked by a tap: framed in green. `undefined` on a board whose cards cannot be picked (no `aria-pressed` then). */
  selected?: boolean;
  onDrop: (to: Point) => void;
  onTap?: () => void;
}) {
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  // The pressed look of a `sink` card: from the press until the release, but for `MIN_PRESS_MS` at least.
  const [held, setHeld] = useState(false);
  const heldSince = useRef(0);
  const letGoTimer = useRef<number | undefined>(undefined);
  const letGo = () => {
    window.clearTimeout(letGoTimer.current);
    letGoTimer.current = window.setTimeout(() => setHeld(false), Math.max(0, MIN_PRESS_MS - (performance.now() - heldSince.current)));
  };
  useEffect(() => () => window.clearTimeout(letGoTimer.current), []);
  const compact = size.height < 90;

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, CARD_SPRING), animate(y, at.y, CARD_SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  return (
    <HintFloat className={dragging ? "relative z-20" : undefined} spin={false} active={hinted}>
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={card.text}
      aria-pressed={selected}
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
        window.clearTimeout(letGoTimer.current);
        heldSince.current = performance.now();
        setHeld(true);
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
        letGo();
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
        letGo();
        animate(x, at.x, CARD_SPRING);
        animate(y, at.y, CARD_SPRING);
      }}
      // A pressed card (`sink`) does not grow: it is pushed down onto its edge, like the buttons.
      // Picked by a tap (`selected`): it bounces (scale 1, 0.95, 1.05, 1) as the module's picked answers do.
      animate={{ scale: selected ? [1, 0.95, 1.05, 1] : dragging && !sink ? 1.05 : 1 }}
      transition={selected !== undefined ? { duration: 0.4, ease: "easeOut" } : undefined}
      // Picked by a tap: the module's picked-answer look (see `PICKED_LOOK`), its edge green and still raised.
      style={{ x, y, width: size.width, height: size.height, zIndex: dragging ? 2 : 1, borderRadius: radius, ...(selected ? PICKED_LOOK : null) }}
      className={`pointer-events-auto absolute top-0 left-0 isolate flex touch-none flex-col overflow-hidden items-center justify-center px-1.5 ${line} ${sink ? `${held ? PRESSED : RAISED_DRAG} transition-[translate,box-shadow] duration-100 ease-out` : RAISED_DRAG} ${EDGE.khaki} enabled:cursor-grab enabled:active:cursor-grabbing ${compact ? "gap-0.5" : "gap-1.5"} ${card.tint}`}
    >
      {/* The hint's orange fill, wiped in from the left behind the content. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ clipPath: hinted ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
      />
      {card.art && (
        <span className={`flex w-full items-center justify-center ${compact ? "min-h-[30px]" : "min-h-[46px]"}`}>{card.art}</span>
      )}
      <span
        className={`text-center font-semibold text-[#444444] dark:text-white ${
          fontSize ? "" : compact ? (sentence ? "text-[12px] leading-4" : "text-[11px] leading-[14px] tracking-[0.2px] uppercase") : "text-[14px] leading-[18px]"
        }`}
        style={fontSize ? { fontSize, lineHeight: "20px" } : undefined}
      >
        {card.text}
      </span>
    </motion.button>
    </HintFloat>
  );
}

/** The numbered slots and the cards: it fills its (sized) dock. */
export function ArrangeBoard({
  cards,
  slots,
  geo,
  disabled,
  hintedId = null,
  selectedId = null,
  onPlace,
  onTap,
  onSlotTap,
  slotLabel,
  slotContent,
}: {
  cards: readonly ArrangeCardDef[];
  slots: Slots;
  geo: ArrangeGeometry;
  disabled: boolean;
  /** The card the hint points at: filled in orange and floating. */
  hintedId?: string | null;
  /** The card picked by a tap, waiting for a slot to be tapped: framed in green (and the slots, if they can be tapped, light up). */
  selectedId?: string | null;
  onPlace: (id: string, slot: number | null) => void;
  /** Tapping a card; without it a tap does nothing (cards that can only be swapped). */
  onTap?: (id: string) => void;
  /** Makes each slot a button; tapping one is how a picked card (see `selectedId`) is put in it. Without it the slots are only drawn. */
  onSlotTap?: (index: number) => void;
  /** The slot buttons' names for a screen reader (with `onSlotTap`). */
  slotLabel?: (index: number) => string;
  /** What an empty slot shows in place of its number (its card, when it holds one, is drawn over it). */
  slotContent?: (index: number) => ReactNode;
}) {
  return (
    <>
      {Array.from({ length: geo.count }, (_, index) => {
        const lit = onSlotTap && selectedId !== null;
        const className = `absolute flex items-center justify-center border-2 ${
          geo.solidSlots
            ? "border-[#D9DEE3] bg-[#EEF1F4] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] dark:border-white/20 dark:bg-white/10"
            : lit
              ? "border-dashed border-[#01A17F] bg-[#F2FBF8] dark:border-[#4DBDA5] dark:bg-white/5"
              : "border-dashed border-[#9AA3AE] bg-white/70 dark:border-white/30 dark:bg-white/5"
        }`;
        const style = { left: geo.slot(index).x, top: geo.slot(index).y, width: geo.card.width, height: geo.card.height, borderRadius: geo.radius };
        const content = slotContent ? (
          slotContent(index)
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#D9DEE3] text-[15px] font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
            {index + 1}
          </span>
        );
        return onSlotTap ? (
          <button
            key={index}
            type="button"
            aria-label={slotLabel?.(index) ?? `Spot ${index + 1}`}
            disabled={disabled}
            onClick={() => onSlotTap(index)}
            className={`${className} enabled:cursor-pointer`}
            style={style}
          >
            {content}
          </button>
        ) : (
          <div key={index} aria-hidden className={className} style={style}>
            {content}
          </div>
        );
      })}
      {cards.map((card, index) => {
        const placed = slots.indexOf(card.id);
        return (
          <ArrangeCard
            key={card.id}
            card={card}
            size={geo.card}
            sentence={geo.sentence}
            line={geo.line}
            radius={geo.radius}
            sink={geo.sink}
            fontSize={geo.fontSize}
            at={placed >= 0 ? geo.slot(placed) : geo.home(index)}
            disabled={disabled}
            hinted={card.id === hintedId}
            selected={onSlotTap ? card.id === selectedId : undefined}
            onDrop={(to) => onPlace(card.id, slotAt(to, geo))}
            onTap={onTap ? () => onTap(card.id) : undefined}
          />
        );
      })}
    </>
  );
}

/**
 * Stands the board on the button row, or hangs it `top` stage px down. `rise` lifts it clear of the result panel;
 * `fade` clears it so what is behind can be seen.
 */
export function ArrangeDock({
  geo,
  top,
  withHint = false,
  rise = 0,
  fade = false,
  children,
}: {
  geo: ArrangeGeometry;
  top?: number;
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
      style={{ ...(top === undefined ? { bottom: aboveButtons(28, withHint) } : { top }), width: geo.board.width, height: geo.board.height, marginLeft: -geo.board.width / 2 }}
    >
      {children}
    </motion.div>
  );
}
