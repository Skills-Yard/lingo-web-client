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
  /**
   * Each card has a plain shadow (its shape, with nothing in it) in its place in the tray, there from the start,
   * behind the card (which covers it), so it is already showing when the card is dragged off it and stays for as long as
   * the card is away, in a slot or being dragged, until the card comes back. A card that bounces (see `bounce`) also has
   * the shadow under it where it rests. The card itself, 3D edge and all, is what moves. On by default; `false` leaves
   * no shadow.
   */
  printStays?: boolean;
  /**
   * Matching, in `columns`: the slots are numbered circles (this many px across) in a narrow column at the right of
   * the cards' rows, each centred on its row, and the cards never leave their rows. Dropping a card on (or tapping) a
   * circle gives the card that number: the circle and the card turn green and the card shows the number; a circle
   * that is taken swaps the two cards' numbers. The cards can be as wide as the rows allow (`card.width`), as the
   * circles take little room.
   */
  circles?: number;
};

/** Where everything stands on the board, and how big the board is. */
export const arrangeGeometry = ({ mode, card, count, gap = 12, lane = mode === "columns" ? 32 : 16, tray = true, slotsOnTop = false, solidSlots = false, sentence = false, line = "border-4 border-white dark:border-[#818185]", radius = 8, sink = false, fontSize, printStays = true, circles }: ArrangeLayout) => {
  const columns = mode === "columns";
  const home = (index: number): Point => (columns ? { x: 0, y: index * (card.height + gap) } : { x: index * (card.width + gap), y: tray && slotsOnTop ? card.height + lane : 0 });
  const slot = (index: number): Point =>
    columns
      ? { x: circles ? card.width + lane : tray ? card.width + lane : 0, y: index * (card.height + gap) + (circles ? (card.height - circles) / 2 : 0) }
      : { x: index * (card.width + gap), y: tray && !slotsOnTop ? card.height + lane : 0 };
  const board = columns
    ? { width: circles ? card.width + lane + circles : tray ? card.width * 2 + lane : card.width, height: count * card.height + (count - 1) * gap }
    : { width: count * card.width + (count - 1) * gap, height: tray ? card.height * 2 + lane : card.height };
  /** A card dropped within this far (px) of a slot's corner goes in it. */
  const reach = card.height * 0.87;
  /** What size a slot is: a card's, or a circle's. */
  const slotSize = circles ? { width: circles, height: circles } : card;
  return { count, card, tray, solidSlots, home, slot, board, reach, sentence, line, radius, sink, fontSize, printStays, circles, slotSize };
};
export type ArrangeGeometry = ReturnType<typeof arrangeGeometry>;

/** The look of a button held down (see `RAISED`): the face has sunk the edge's 4px and the edge is gone. It moves with `translate`, which sits beside the `transform` the drag sets. */
const PRESSED = "translate-y-1 shadow-[0_0_0_var(--edge)]";

/** Below this far (px) a press and release is a tap, not a drag. */
const TAP_SLOP = 6;
/** A pressed card (`sink`) stays pushed down at least this long (ms), so a quick tap still shows its 3D press. */
const MIN_PRESS_MS = 160;
/** The shadow itself: a plain, soft grey shape. */
const SHADOW = "rgba(0,0,0,0.09)";
/** A card picked by a tap looks like the module's picked answers: a 4px green border, a pale mint face and the green raised edge. */
const PICKED_LOOK = { borderWidth: 4, borderColor: "#01A17F", backgroundColor: "#F2FBF8", "--edge": "#008566" } as CSSProperties;
/** A card that has been given its number (circle slots, see `ArrangeLayout.circles`) is filled with the brand green, like the module's green buttons: a green face and border with the dark green raised edge, its words white. */
const FILLED_LOOK = { borderColor: "#01A17F", backgroundColor: "#01A17F", "--edge": "#004635" } as CSSProperties;
/** A card marked wrong (see `ArrangeBoard`'s `wrongIds`) looks like the module's wrong answers: a 4px red border, a pale pink face and the red raised edge. */
const WRONG_LOOK = { borderWidth: 4, borderColor: "#E5484D", backgroundColor: "#FFF1F1", "--edge": "#B3261E" } as CSSProperties;
/**
 * The bounce of a board that is all right (`bounce`): each card in turn, in the order of the slots, springs up high,
 * comes down, springs up a little (about a third as high, in about 0.6 of the time, as a real ball loses height and
 * hang time) and settles. Up decelerates and down accelerates, as under gravity. The card's print stays on the ground.
 */
const BOUNCE_FIRST_S = 0.4;
const BOUNCE_STAGGER_S = 0.25;
const BOUNCE_BIG = 24;
const BOUNCE_MINI = 9;
const BOUNCE_S = 1;
const BOUNCE_TIMES = [0, 0.31, 0.625, 0.815, 1];
/**
 * And once, with the bounce, a shine: a slim slanted band of light crossing the card from left to right (as the match
 * screen's cards have), and a small star on each corner that twinkles one after the other, in and out, at low
 * opacity. They are gone (not looped) by `SHINE_ENDS_S` after the bounce starts.
 */
const SHINE_AFTER_S = 0.05;
const SHINE_S = 0.7;
const SHINE_BAND = "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)";
/** The shine on a card a hint's hand points at (see `ArrangeBoard`'s `pointedId`): one quick crossing, as long as the hand's stay on it (about half a second). */
const POINT_SHINE_S = 0.5;
const STAR_S = 0.9;
const STAR_PEAK = 0.5;
const STAR_COLOUR = "#FFB300";
const SHINE_ENDS_S = 1.6;
/** The four corner stars: which corner, how big (px) and how long after the shine starts it twinkles. A star is centred on its corner. */
const STARS = [
  { corner: "tl", size: 14, after: 0.1 },
  { corner: "tr", size: 10, after: 0.25 },
  { corner: "br", size: 13, after: 0.4 },
  { corner: "bl", size: 9, after: 0.55 },
] as const;
/** A four-point star, drawn in the colour of the text around it. */
const STAR_PATH = "M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z";
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

/** With circle slots (a card never leaves its row): the circle the pointer was let go at, if it was within `CIRCLE_REACH` of one's centre. */
const CIRCLE_REACH = 48;
const slotNear = (pointer: Point, geo: ArrangeGeometry) => {
  let nearest = -1;
  let nearestDistance = Infinity;
  const radius = (geo.circles ?? 0) / 2;
  for (let index = 0; index < geo.count; index += 1) {
    const slot = geo.slot(index);
    const distance = Math.hypot(pointer.x - (slot.x + radius), pointer.y - (slot.y + radius));
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  }
  return nearestDistance <= CIRCLE_REACH ? nearest : null;
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
  printStays,
  tray,
  home,
  bounceDelay,
  at,
  disabled,
  hinted,
  selected,
  wrong,
  locked,
  pointed,
  tapOnly,
  filled,
  number,
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
  /** A plain shadow stays where the card started, once it has left (see `ArrangeLayout.printStays`). */
  printStays: boolean;
  /** The cards start in a tray (otherwise they start in their slots, and there is no place to leave a shadow). */
  tray: boolean;
  /** Where the card starts: its place in the tray. */
  home: Point;
  /** Bounces once, this many seconds from now (see `BOUNCE_S`); `undefined` while it does not. */
  bounceDelay?: number;
  at: Point;
  disabled: boolean;
  hinted: boolean;
  /** Picked by a tap: framed in green. `undefined` on a board whose cards cannot be picked (no `aria-pressed` then). */
  selected?: boolean;
  /** Marked wrong: the module's wrong look (red). */
  wrong?: boolean;
  /** Cannot be touched (given its place for good). */
  locked?: boolean;
  /** A hint's hand is pointing at it: a tint and one shine, while it is. */
  pointed?: boolean;
  /** Cannot be dragged: it is pressed (3D) and tapped like a button, and never leaves its place. */
  tapOnly?: boolean;
  /** Given its number (circle slots): filled with green, its words white. */
  filled?: boolean;
  /** The place the card is in, shown as a round badge on its corner; `undefined` for no badge. */
  number?: number;
  /** Dropped: `to` is where its top left is, `pointer` where the pointer was let go (both in the board's px). */
  onDrop: (to: Point, pointer: Point) => void;
  onTap?: () => void;
}) {
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
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
  // The card is in the air on its bounce: the shadow under it shows.
  const [bouncing, setBouncing] = useState(false);
  // Its one-time shine and corner stars are playing.
  const [shining, setShining] = useState(false);
  const compact = size.height < 90;

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, CARD_SPRING), animate(y, at.y, CARD_SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  // Marked wrong: the card shakes sideways once, as the module's wrong answers do.
  useEffect(() => {
    if (!wrong) return;
    const shake = animate(x, [at.x, at.x - 7, at.x + 7, at.x - 5, at.x + 5, at.x], { duration: 0.35 });
    return () => shake.stop();
  }, [wrong, at.x, x]);

  // The bounce: the card goes up and down about where it rests; its print (see `printStays`) stays on the ground.
  useEffect(() => {
    if (bounceDelay === undefined) return;
    // Started from a timer, not with the animation's own delay: a new animation on `y` stops the one running, and the card may still be gliding into its slot.
    let bounce: { stop: () => void } | undefined;
    const timer = window.setTimeout(() => {
      setBouncing(true);
      setShining(true);
      bounce = animate(y, [at.y, at.y - BOUNCE_BIG, at.y, at.y - BOUNCE_MINI, at.y], {
        duration: BOUNCE_S,
        times: BOUNCE_TIMES,
        ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
      });
    }, bounceDelay * 1000);
    // The shadow under the card goes a moment after it has landed.
    const endTimer = window.setTimeout(() => setBouncing(false), bounceDelay * 1000 + BOUNCE_S * 1000 + 150);
    // The shine and the stars play once, and are taken out when they are done.
    const shineEndTimer = window.setTimeout(() => setShining(false), (bounceDelay + SHINE_ENDS_S) * 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(endTimer);
      window.clearTimeout(shineEndTimer);
      bounce?.stop();
    };
  }, [bounceDelay, at.y, y]);

  // What is on the card (its picture and its words).
  const content = (
    <>
      {card.art && (
        <span className={`flex w-full items-center justify-center ${compact ? "min-h-[30px]" : "min-h-[46px]"}`}>{card.art}</span>
      )}
      <span
        className={`text-center font-semibold ${filled && !wrong && !selected ? "text-white" : "text-[#444444] dark:text-white"} ${
          fontSize ? "" : compact ? (sentence ? "text-[12px] leading-4" : "text-[11px] leading-[14px] tracking-[0.2px] uppercase") : "text-[14px] leading-[18px]"
        }`}
        style={fontSize ? { fontSize, lineHeight: "20px" } : undefined}
      >
        {card.text}
      </span>
    </>
  );

  return (
    <HintFloat className={dragging ? "relative z-20" : undefined} spin={false} active={hinted}>
    {/* The card's shadow in its place in the tray: a plain shape the size of the card, with nothing in it. It is there from the start, behind the card (which covers it), so the card leaves it showing the moment it is dragged off, and it stays for as long as the card is away, until the card comes back. A card that cannot be dragged (`tapOnly`) has none. */}
    {printStays && tray && !tapOnly && (
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: home.x, top: home.y, width: size.width, height: size.height, zIndex: 0, borderRadius: radius, backgroundColor: SHADOW }}
      />
    )}
    {/* And the same plain shadow under the card while it bounces, on the ground where it rests. */}
    {printStays && (
      <span
        aria-hidden
        className={`pointer-events-none absolute transition-opacity duration-150 ${bouncing ? "opacity-100" : "opacity-0"}`}
        style={{ left: at.x, top: at.y, width: size.width, height: size.height, zIndex: 0, borderRadius: radius, backgroundColor: SHADOW }}
      />
    )}
    <motion.button
      type="button"
      disabled={disabled || locked}
      // Where a pointing hand can find it (see the Variable module's `TapHint`).
      data-hint={card.id}
      aria-label={card.text}
      aria-pressed={selected}
      onPointerDown={(event) => {
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        const rect = box.getBoundingClientRect();
        const scale = rect.width / box.offsetWidth || 1;
        drag.current = {
          startX: event.clientX,
          startY: event.clientY,
          fromX: x.get(),
          fromY: y.get(),
          scale,
          // Where on the card the pointer took hold of it (the board's px): the pointer is then at the card's x, y plus this.
          offsetX: (event.clientX - rect.left) / scale,
          offsetY: (event.clientY - rect.top) / scale,
          moved: false,
        };
        if (!tapOnly) setDragging(true);
        window.clearTimeout(letGoTimer.current);
        heldSince.current = performance.now();
        setHeld(true);
      }}
      onPointerMove={(event) => {
        const now = drag.current;
        // A tap-only card stays where it is, whatever the pointer does.
        if (!now || tapOnly) return;
        const dx = event.clientX - now.startX;
        const dy = event.clientY - now.startY;
        if (!now.moved && Math.hypot(dx, dy) > TAP_SLOP) now.moved = true;
        x.set(now.fromX + dx / now.scale);
        y.set(now.fromY + dy / now.scale);
      }}
      onPointerUp={(event) => {
        const now = drag.current;
        drag.current = null;
        setDragging(false);
        letGo();
        if (!now) return;
        if (tapOnly) {
          // Like a button: it is a tap if the pointer is let go over the card (the pointer is captured, so the card is told wherever it is let go).
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) onTap?.();
          return;
        }
        if (now.moved) onDrop({ x: x.get(), y: y.get() }, { x: x.get() + now.offsetX, y: y.get() + now.offsetY });
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
      // A tap-only card is also pressed with the keyboard (Enter or Space is a click with no pointer: `detail` 0).
      onClick={tapOnly ? (event) => { if (event.detail === 0) onTap?.(); } : undefined}
      // A pressed card (`sink`) does not grow: it is pushed down onto its edge, like the buttons.
      // Picked by a tap (`selected`): it bounces (scale 1, 0.95, 1.05, 1) as the module's picked answers do.
      animate={{ scale: selected ? [1, 0.95, 1.05, 1] : dragging && !sink ? 1.05 : 1 }}
      transition={selected !== undefined ? { duration: 0.4, ease: "easeOut" } : undefined}
      // Picked by a tap: the module's picked-answer look (see `PICKED_LOOK`), its edge green and still raised.
      style={{ x, y, width: size.width, height: size.height, zIndex: dragging ? 2 : 1, borderRadius: radius, ...(wrong ? WRONG_LOOK : selected ? PICKED_LOOK : filled ? FILLED_LOOK : null) }}
      className={`pointer-events-auto absolute top-0 left-0 isolate flex touch-none flex-col overflow-hidden items-center justify-center px-1.5 ${line} ${sink ? `${held ? PRESSED : RAISED_DRAG} transition-[translate,box-shadow] duration-100 ease-out` : RAISED_DRAG} ${EDGE.khaki} ${tapOnly ? "enabled:cursor-pointer" : "enabled:cursor-grab enabled:active:cursor-grabbing"} ${compact ? "gap-0.5" : "gap-1.5"} ${card.tint}`}
    >
      {/* The hint's orange fill, wiped in from the left behind the content. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ clipPath: hinted ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
      />
      {content}
      {/* Pointed at (by a hint's hand): a pale orange tint behind the words while the hand is on it, and a shine crossing it once. No float; it goes with the hand. */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: pointed ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
      />
      {pointed && (
        <motion.span
          aria-hidden
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: [-60, size.width + 20], opacity: [0, 1, 1, 0] }}
          transition={{ duration: POINT_SHINE_S, ease: "easeInOut", opacity: { duration: POINT_SHINE_S, times: [0, 0.2, 0.8, 1] } }}
          style={{ skewX: -20, backgroundImage: SHINE_BAND }}
          className="pointer-events-none absolute inset-y-0 left-0 w-14"
        />
      )}
      {/* The shine: a slim slanted band of light crossing the card once, from left to right, clipped by the card. */}
      {shining && (
        <motion.span
          aria-hidden
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: [-60, size.width + 20], opacity: [0, 1, 1, 0] }}
          transition={{ duration: SHINE_S, delay: SHINE_AFTER_S, ease: "easeInOut", opacity: { duration: SHINE_S, delay: SHINE_AFTER_S, times: [0, 0.2, 0.8, 1] } }}
          style={{ skewX: -20, backgroundImage: SHINE_BAND }}
          className="pointer-events-none absolute inset-y-0 left-0 w-14"
        />
      )}
    </motion.button>
    {/* What stands on the card's corners: on a box that goes where the card goes (the same x and y), over the card and not clipped by it, so each thing sits on a corner, half outside. The place number is a round badge on the top left (green, red when the card is marked wrong); the stars are four corner stars that twinkle in turn, once, at low opacity. */}
    {(shining || number !== undefined) && (
      <motion.div aria-hidden className="pointer-events-none absolute top-0 left-0" style={{ x, y, width: size.width, height: size.height, zIndex: 3 }}>
        {number !== undefined && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className={`absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full border-2 border-white text-[13px] leading-none font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] ${wrong ? "bg-[#E5484D]" : filled && !selected ? "bg-white text-[#01A17F]! border-[#01A17F]" : "bg-[#01A17F]"}`}
          >
            {number}
          </motion.span>
        )}
        {shining && STARS.map((star) => {
          const half = -star.size / 2;
          const place = { [star.corner[0] === "t" ? "top" : "bottom"]: half, [star.corner[1] === "l" ? "left" : "right"]: half };
          return (
            <motion.svg
              key={star.corner}
              viewBox="0 0 24 24"
              width={star.size}
              height={star.size}
              initial={{ scale: 0, opacity: 0, rotate: -30 }}
              animate={{ scale: [0, 1, 0.7, 0], opacity: [0, STAR_PEAK, STAR_PEAK * 0.7, 0], rotate: [-30, 0, 15, 30] }}
              transition={{ duration: STAR_S, delay: SHINE_AFTER_S + star.after, times: [0, 0.35, 0.7, 1], ease: "easeInOut" }}
              className="absolute"
              style={{ ...place, color: STAR_COLOUR }}
            >
              <path d={STAR_PATH} fill="currentColor" />
            </motion.svg>
          );
        })}
      </motion.div>
    )}
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
  bounce = false,
  wrongIds = [],
  lockedIds = [],
  pointedId = null,
  tapOnly = false,
  activeSlot,
  numbered = false,
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
  /** Every card is right: each card in a slot bounces in turn, in the order of the slots (their prints stay down with `geo.printStays`). */
  bounce?: boolean;
  /** Cards marked wrong: they look like the module's wrong answers (red), badge included. */
  wrongIds?: readonly string[];
  /** Cards that can no longer be moved (they were given their place for good): they cannot be touched. */
  lockedIds?: readonly string[];
  /** The card a hint's hand is pointing at, for as long as it points: it takes a pale orange tint and one shine, and nothing else (it does not float, unlike `hintedId`). */
  pointedId?: string | null;
  /** The cards cannot be dragged, only tapped (so `onPlace` is not needed): they stay in their places and are given their numbers by `onTap`. */
  tapOnly?: boolean;
  /** Only this slot is open (the one that is next, with circle slots): it is outlined in green and pulses, an empty slot after it is dimmed. `undefined`: all slots are alike. */
  activeSlot?: number;
  /** A card in a slot shows the slot's number on its corner (a round badge), as the slot's own number is under the card. */
  numbered?: boolean;
  /** A card is dropped: `slot` is the slot it was let go on (`null` for none). Not needed with `tapOnly`. */
  onPlace?: (id: string, slot: number | null) => void;
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
        const isActive = activeSlot !== undefined && activeSlot === index;
        const lit = (onSlotTap && selectedId !== null) || isActive;
        // An empty slot that is not the open one is dimmed.
        const dim = activeSlot !== undefined && !isActive && slots[index] === null;
        // Circle slots (matching): a circle is filled with green once a card has its number (red if that card is marked wrong), and is a dashed outline until then.
        const holder = slots[index];
        const taken = geo.circles && holder !== null;
        const slotWrong = taken && wrongIds.includes(holder);
        const className = `absolute flex items-center justify-center ${geo.circles ? "rounded-full" : ""} ${dim ? "opacity-50" : ""} ${isActive ? "animate-pulse" : ""} border-2 ${
          taken
            ? slotWrong
              ? "border-[#E5484D] bg-[#E5484D] text-white"
              : "border-[#01A17F] bg-[#01A17F] text-white"
            : geo.solidSlots
              ? "border-[#D9DEE3] bg-[#EEF1F4] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] dark:border-white/20 dark:bg-white/10"
              : lit
                ? "border-dashed border-[#01A17F] bg-[#F2FBF8] dark:border-[#4DBDA5] dark:bg-white/5"
                : "border-dashed border-[#9AA3AE] bg-white/70 dark:border-white/30 dark:bg-white/5"
        }`;
        const style = { left: geo.slot(index).x, top: geo.slot(index).y, width: geo.slotSize.width, height: geo.slotSize.height, borderRadius: geo.circles ? undefined : geo.radius };
        const content = slotContent ? (
          slotContent(index)
        ) : geo.circles ? (
          <span className={`text-[16px] leading-none font-bold ${taken ? "text-white" : "text-[#5C6670] dark:text-white/70"}`}>{index + 1}</span>
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#D9DEE3] text-[15px] font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
            {index + 1}
          </span>
        );
        return onSlotTap ? (
          <button
            key={index}
            type="button"
            data-hint={`slot-${index}`}
            aria-label={slotLabel?.(index) ?? `Spot ${index + 1}`}
            disabled={disabled}
            onClick={() => onSlotTap(index)}
            className={`${className} pointer-events-auto enabled:cursor-pointer`}
            style={style}
          >
            {content}
          </button>
        ) : (
          <div key={index} aria-hidden data-hint={`slot-${index}`} className={className} style={style}>
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
            printStays={geo.printStays}
            tray={geo.tray}
            home={geo.home(index)}
            bounceDelay={bounce && placed >= 0 ? BOUNCE_FIRST_S + placed * BOUNCE_STAGGER_S : undefined}
            // With circle slots a card never leaves its row: it is only given a number.
            at={placed >= 0 && !geo.circles ? geo.slot(placed) : geo.home(index)}
            disabled={disabled}
            hinted={card.id === hintedId}
            selected={onSlotTap ? card.id === selectedId : undefined}
            wrong={wrongIds.includes(card.id)}
            locked={lockedIds.includes(card.id)}
            pointed={card.id === pointedId}
            tapOnly={tapOnly}
            filled={!!geo.circles && placed >= 0}
            number={(numbered || !!geo.circles) && placed >= 0 ? placed + 1 : undefined}
            onDrop={(to, pointer) => onPlace?.(card.id, geo.circles ? slotNear(pointer, geo) : slotAt(to, geo))}
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
