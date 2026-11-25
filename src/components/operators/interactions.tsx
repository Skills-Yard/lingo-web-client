"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { RightBounce, WAVE_ROLL_S } from "@/components/level-two/RightBounce";
import { SeenBadge } from "./FlipCarousel";
import type { InteractionApi } from "./screen";
import { EDGE, RAISED, RAISED_SMALL } from "@/components/ui/raised";
import { TINT } from "./SituationsStage";
import { CARD, CARD_FACE, CREAM, Pic, ExprBig, ShareScene, WHITE, isOperator } from "./visuals";

const SHAKE = [0, -7, 7, -5, 5, 0];
/** A wrong try shakes red for this long (ms). */
const WRONG_MS = 800;
const PILL = "cursor-pointer rounded-full bg-[#08A4AD] px-6 py-2 text-[16px] leading-6 font-bold text-white shadow-[0_3px_0_#067F86] active:translate-y-px active:shadow-[0_2px_0_#067F86]";

/** The sizes of the places and blocks: long expressions (a * b + c * d) get smaller ones so they fit a line. A place is at least `cell` big, and grows with the block in it. */
const SIZE = {
  roomy: { cell: "h-12 min-w-11", placed: "h-12 min-w-11 text-[21px]", tray: "h-12 min-w-12 text-[21px]" },
  tight: { cell: "h-10 min-w-9", placed: "h-10 min-w-9 text-[17px]", tray: "h-11 min-w-11 text-[19px]" },
} as const;
/** Below this far (px) a press and release is a tap, not a drag. */
const TAP_SLOP = 6;
/** A block let go within this far (px) of a place goes in it (the gap between two places is 6px). */
const DROP_REACH = 14;
/** The plain shadow a block leaves where it stands (its shape, with nothing in it). */
const BLOCK_SHADOW = "bg-black/[0.09] dark:bg-white/[0.08]";
const BLOCK_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
const VALUE_BLOCK = "border-2 border-[#E4DFF7] bg-[#F6F4FE] text-[#444444] shadow-[0_3px_0_#D3CCF0] dark:border-[#3B3670] dark:bg-[#2E2A5C] dark:text-white dark:shadow-[0_3px_0_#1B1840]";
const OPERATOR_BLOCK = "bg-[#08A4AD] text-white shadow-[0_3px_0_#067F86]";

/** What a stage tells the learner when something is not right yet. */
function Note({ children }: { children: ReactNode }) {
  return <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]">{children}</p>;
}

/** The ways to write `a * b + c * d`-like sums: each term may be written either way round, and the terms either way round. */
export const sumOfProducts = (a: readonly [string, string], b: readonly [string, string]): string[][] => {
  const terms = (pair: readonly [string, string]) => [[pair[0], "*", pair[1]], [pair[1], "*", pair[0]]];
  const out: string[][] = [];
  for (const first of terms(a)) for (const second of terms(b)) out.push([...first, "+", ...second], [...second, "+", ...first]);
  return out;
};

/**
 * A block that can be tapped or dragged. A press that stays put is a tap (`onTap`); a drag follows the pointer (the stage
 * is scaled as one piece, so the pointer's screen px are converted to the stage's), `onMove` is told where it is on the
 * way (`null` once it is let go) and `onDrop` where it was let go: it says whether the block went somewhere (then the
 * block that was dragged is already in its new place, and starts from its own at once), else it glides back.
 */
function DragBlock({
  label,
  disabled,
  className,
  popIn = false,
  onTap,
  onMove,
  onDrop,
  children,
}: {
  label: string;
  disabled: boolean;
  className: string;
  /** It pops in (it has just been put in its place). */
  popIn?: boolean;
  onTap: () => void;
  onMove: (point: { x: number; y: number } | null) => void;
  onDrop: (point: { x: number; y: number }) => boolean;
  children: ReactNode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const press = useRef<{ startX: number; startY: number; scale: number; moved: boolean } | null>(null);
  const [state, setState] = useState<"rest" | "pressed" | "dragging">("rest");

  const goHome = (glide: boolean) => {
    if (glide) {
      animate(x, 0, BLOCK_SPRING);
      animate(y, 0, BLOCK_SPRING);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={label}
      onPointerDown={(event) => {
        // A disabled button may still get pointer events.
        if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        press.current = { startX: event.clientX, startY: event.clientY, scale: box.getBoundingClientRect().width / box.offsetWidth || 1, moved: false };
        setState("pressed");
      }}
      onPointerMove={(event) => {
        const now = press.current;
        if (!now) return;
        const dx = event.clientX - now.startX;
        const dy = event.clientY - now.startY;
        if (!now.moved) {
          if (Math.hypot(dx, dy) <= TAP_SLOP) return;
          now.moved = true;
          setState("dragging");
        }
        x.set(dx / now.scale);
        y.set(dy / now.scale);
        onMove({ x: event.clientX, y: event.clientY });
      }}
      onPointerUp={(event) => {
        const now = press.current;
        press.current = null;
        setState("rest");
        if (!now) return;
        if (!now.moved) return onTap();
        onMove(null);
        goHome(!onDrop({ x: event.clientX, y: event.clientY }));
      }}
      onPointerCancel={() => {
        const moved = press.current?.moved;
        press.current = null;
        setState("rest");
        if (moved) {
          onMove(null);
          goHome(true);
        }
      }}
      // The keyboard (Enter or Space is a click with no pointer: `detail` 0).
      onClick={(event) => {
        if (event.detail === 0 && !disabled) onTap();
      }}
      initial={popIn ? { scale: 0.6, opacity: 0 } : false}
      animate={{ scale: state === "dragging" ? 1.08 : state === "pressed" ? 0.92 : 1, opacity: 1 }}
      transition={popIn ? { type: "spring", stiffness: 420, damping: 22 } : { duration: 0.12 }}
      style={{ x, y, zIndex: state === "rest" ? 0 : 20 }}
      className={`relative touch-none rounded-[10px] leading-none font-bold enabled:cursor-grab enabled:active:cursor-grabbing disabled:cursor-default ${className}`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Build an expression from blocks. Tap a block and it goes to the first empty place, from the left, whatever it is (a
 * value or an operator): no place is kept for a kind. Or drag a block from the tray onto a place: an empty place takes it,
 * a taken one is replaced (the block that was there is out again). A block in the expression can be dragged to another
 * place too, and swaps with what is there; tap one in the expression to take it back out (its place stays where it is).
 * When every place is filled it is checked: a right one turns green and shows its result (the stage is done), a wrong one
 * shakes red with a hint and counts as a slip, then starts again.
 */
export function ExpressionStage({
  api,
  lead,
  prompt = "Tap or drag the blocks to build it.",
  tokens,
  accept,
  hint,
  result,
}: {
  api: InteractionApi;
  /** What stands above the blocks (the situation). */
  lead?: ReactNode;
  prompt?: string;
  /** The blocks, in the order they are shown; each can be used once. */
  tokens: readonly string[];
  /** Every way of writing it that is right (all the same length). */
  accept: readonly (readonly string[])[];
  hint: string;
  /** What it works out to, shown once it is right. */
  result?: string;
}) {
  const { slip, done, finished } = api;
  const length = accept[0].length;
  const size = SIZE[length > 5 ? "tight" : "roomy"];
  // The block (its place in `tokens`) in each place of the expression, if there is one.
  const [slots, setSlots] = useState<readonly (number | undefined)[]>(() => Array<number | undefined>(length).fill(undefined));
  const [ok, setOk] = useState(false);
  const [bad, setBad] = useState(false);
  // The place a dragged block is over, lit while it is.
  const [over, setOver] = useState(-1);
  // The place whose block is being dragged.
  const [lifted, setLifted] = useState(-1);
  const row = useRef<HTMLDivElement>(null);
  const filled = slots.filter((entry) => entry !== undefined).length;
  // The first empty place, picked out while there is one to fill.
  const nextPlace = ok || bad || finished || filled >= length ? -1 : slots.findIndex((entry) => entry === undefined);

  /** The place a point (screen px) is on, or within `DROP_REACH` of; -1 for none. */
  const placeAt = (point: { x: number; y: number } | null) => {
    if (!point || !row.current) return -1;
    let nearest = -1;
    let nearestDistance = DROP_REACH;
    row.current.querySelectorAll<HTMLElement>("[data-place]").forEach((cell) => {
      const box = cell.getBoundingClientRect();
      const distance = Math.hypot(Math.max(box.left - point.x, 0, point.x - box.right), Math.max(box.top - point.y, 0, point.y - box.bottom));
      if (distance <= nearestDistance) {
        nearest = Number(cell.dataset.place);
        nearestDistance = distance;
      }
    });
    return nearest;
  };

  const check = (next: readonly (number | undefined)[]) => {
    const written = next.map((index) => (index === undefined ? "" : tokens[index]));
    if (accept.some((way) => way.length === written.length && way.every((token, place) => token === written[place]))) {
      setOk(true);
      window.setTimeout(() => done(), 600);
      return;
    }
    slip();
    setBad(true);
    window.setTimeout(() => {
      setBad(false);
      setSlots(Array<number | undefined>(length).fill(undefined));
    }, WRONG_MS);
  };

  /** The expression with the blocks changed: it is checked once every place is filled. */
  const commit = (next: readonly (number | undefined)[]) => {
    playClickSound();
    vibrateForTap();
    setSlots(next);
    if (next.every((entry) => entry !== undefined)) check(next);
  };

  /** A tap on a block in the tray: it goes to the first empty place, from the left. */
  const pick = (index: number) => {
    if (ok || bad || finished || slots.includes(index)) return;
    const place = slots.findIndex((entry) => entry === undefined);
    if (place < 0) return;
    commit(slots.map((entry, at) => (at === place ? index : entry)));
  };

  /**
   * A block let go over a place. From the tray it takes the place (the block that was there is out again); from another
   * place it swaps with what is there (or just moves, if it was empty). Whether it went anywhere.
   */
  const dropOn = (index: number, point: { x: number; y: number }) => {
    const place = placeAt(point);
    const from = slots.indexOf(index);
    if (ok || bad || finished || place < 0 || place === from) return false;
    const next = [...slots];
    if (from >= 0) next[from] = slots[place];
    next[place] = index;
    commit(next);
    return true;
  };

  const takeOut = (index: number) => {
    if (ok || bad || finished) return;
    playClickSound();
    setSlots((now) => now.map((entry) => (entry === index ? undefined : entry)));
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      {lead}
      <motion.div
        ref={row}
        animate={{ x: bad ? SHAKE : 0 }}
        transition={{ duration: 0.4 }}
        className={`flex min-h-[68px] w-full flex-wrap items-center justify-center gap-1.5 px-3 py-2 ${CARD} ${ok ? LOOKS.correct.card : bad ? LOOKS.wrong.card : WHITE}`}
      >
        {Array.from({ length }, (_, place) => {
          const index = slots[place];
          const lit = over === place;
          return (
            // A place is as big as its dashed outline (or its block, if that is wider) and stays where it is when its block is dragged off: what is left is the block's plain shadow.
            <span key={place} data-place={place} className={`relative flex shrink-0 ${size.cell} ${lifted === place ? "z-30" : ""}`}>
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 rounded-[10px] transition-colors ${
                  index === undefined
                    ? `border-2 border-dashed ${lit ? "border-[#08A4AD] bg-[#08A4AD]/20" : place === nextPlace ? "border-[#08A4AD] bg-[#08A4AD]/10 motion-safe:animate-pulse" : "border-[#C9CED6] dark:border-white/20"}`
                    : lit
                      ? "bg-[#08A4AD]/30"
                      : BLOCK_SHADOW
                }`}
              />
              {index !== undefined && (
                // Once the expression is right its blocks bounce as a wave from the left (a value, the operator, a value): each starts as the one before it reaches the top of its jump.
                <RightBounce play={ok} delay={place * WAVE_ROLL_S} radius={10} className="flex shrink-0">
                  <DragBlock
                    key={index}
                    popIn
                    label={`${tokens[index]} (tap to take out, or drag to another place)`}
                    disabled={ok || bad || finished}
                    className={`px-2 ${size.placed} ${isOperator(tokens[index]) ? OPERATOR_BLOCK : VALUE_BLOCK}`}
                    onTap={() => takeOut(index)}
                    onMove={(point) => {
                      setOver(placeAt(point));
                      // The place whose block is being dragged stands over the others, so the block is not hidden behind the places to its right.
                      setLifted(point ? place : -1);
                    }}
                    onDrop={(point) => dropOn(index, point)}
                  >
                    {tokens[index]}
                  </DragBlock>
                </RightBounce>
              )}
            </span>
          );
        })}
        {result !== undefined && (
          <span className="flex items-center gap-1.5 pl-1">
            <span className="text-[22px] leading-6 font-bold text-[#08A4AD]">=</span>
            {ok ? (
              <motion.span
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="rounded-[10px] bg-[#04908F] px-3 py-1.5 text-[20px] leading-6 font-bold text-white"
              >
                {result}
              </motion.span>
            ) : (
              <span className="rounded-[10px] bg-[#E3F6F3] px-3 py-1.5 text-[20px] leading-6 font-bold text-[#08A4AD] dark:bg-[#0F2B28]">?</span>
            )}
          </span>
        )}
      </motion.div>
      <div className="flex flex-wrap justify-center gap-2">
        {tokens.map((token, index) => {
          const used = slots.includes(index);
          return (
            // Each block has its plain shadow in its place in the tray from the start, behind it: the block can be dragged off it, and stays faded over it while it is in the expression.
            <span key={index} className="relative flex">
              <span aria-hidden className={`pointer-events-none absolute inset-0 rounded-[10px] ${BLOCK_SHADOW}`} />
              <motion.span initial={false} animate={{ opacity: used ? 0.25 : 1 }} className="flex">
                <DragBlock
                  label={token}
                  disabled={used || ok || bad || finished}
                  className={`px-2.5 ${size.tray} ${isOperator(token) ? OPERATOR_BLOCK : VALUE_BLOCK}`}
                  onTap={() => pick(index)}
                  onMove={(point) => setOver(placeAt(point))}
                  onDrop={(point) => dropOn(index, point)}
                >
                  {token}
                </DragBlock>
              </motion.span>
            </span>
          );
        })}
      </div>
      <Note>{bad ? hint : <span className="text-[#6B7480] dark:text-white/60">{finished ? "" : prompt}</span>}</Note>
    </div>
  );
}

/**
 * Share chocolates equally: each tap gives every student one (a round). It is
 * done when there are too few left to give everyone another. What each student
 * got and what is left over show at the end.
 */
export function ShareStage({ api, total, students, after }: { api: InteractionApi; total: number; students: number; after?: ReactNode }) {
  const { done, finished } = api;
  const [rounds, setRounds] = useState(0);
  const pile = total - rounds * students;
  const over = pile < students;

  const share = () => {
    if (over || finished) return;
    playClickSound();
    vibrateForTap();
    const next = rounds + 1;
    setRounds(next);
    if (total - next * students < students) window.setTimeout(() => done(), 900);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      <ShareScene pile={pile} trays={Array.from({ length: students }, () => rounds)} />
      {over ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-[#E3F6F3] px-3.5 py-1 text-[14px] leading-5 font-bold text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FE0D6]">Each student has {rounds}</span>
          <span className="rounded-full bg-[#FFF4E3] px-3.5 py-1 text-[14px] leading-5 font-bold text-[#B85A28] dark:bg-[#4A3418] dark:text-[#FFB267]">Left over: {pile}</span>
        </motion.div>
      ) : (
        <button type="button" onClick={share} className={PILL}>
          Give one to each student
        </button>
      )}
      {over && after}
    </div>
  );
}

/** One chair. */
function Chair({ lit }: { lit: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[26px]">
      <rect x="6" y="2" width="12" height="9" rx="2" fill={lit ? "#04ACAB" : "#7C6BE0"} />
      <rect x="4" y="11" width="16" height="5" rx="2" fill={lit ? "#08A4AD" : "#5B3FD0"} />
      <rect x="6" y="16" width="2.5" height="6" rx="1" fill="#444444" />
      <rect x="15.5" y="16" width="2.5" height="6" rx="1" fill="#444444" />
    </svg>
  );
}

/**
 * Rows with room for chairs: tap a row to put its chairs in (one after another).
 * It is done when every row is full; each row's count shows beside it.
 */
export function FillRowsStage({ api, rows, per, after }: { api: InteractionApi; rows: number; per: number; after?: ReactNode }) {
  const { done, finished } = api;
  const [filled, setFilled] = useState<readonly number[]>([]);

  const fill = (row: number) => {
    if (filled.includes(row) || finished) return;
    playClickSound();
    vibrateForTap();
    const next = [...filled, row];
    setFilled(next);
    if (next.length === rows) window.setTimeout(() => done(), per * 160 + 700);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      <div className={`flex w-full flex-col gap-1.5 px-2 py-2 ${CARD} ${CREAM}`}>
        {Array.from({ length: rows }, (_, row) => {
          const full = filled.includes(row);
          return (
            <button
              key={row}
              type="button"
              onClick={() => fill(row)}
              aria-label={`Row ${row + 1}`}
              className={`flex h-[44px] cursor-pointer items-center gap-2 rounded-[10px] border-2 px-2 ${RAISED_SMALL} ${full ? "border-[#7FD8CC] bg-[#E3F6F3] [--edge:#7FD8CC] dark:bg-[#0F2B28]" : `border-dashed border-[#C9CED6] bg-white/70 dark:bg-white/5 ${EDGE.pale}`}`}
            >
              <span className={`w-[48px] rounded-full px-2 py-0.5 text-center text-[11px] leading-4 font-bold transition-colors ${full ? "bg-[#04ACAB] text-white" : "bg-[#EEF0F4] text-[#6B7480] dark:bg-white/10 dark:text-white/60"}`}>Row {row + 1}</span>
              <span className="flex flex-1 items-center justify-center gap-1">
                {Array.from({ length: per }, (_, seat) =>
                  full ? (
                    <motion.span key={seat} initial={{ opacity: 0, scale: 0.3, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: seat * 0.16 }}>
                      <Chair lit />
                    </motion.span>
                  ) : (
                    <span key={seat} className="size-[26px] rounded-md border-2 border-dotted border-[#C9CED6]" />
                  ),
                )}
              </span>
              <motion.span animate={{ opacity: full ? 1 : 0, scale: full ? 1 : 0.5 }} transition={{ delay: per * 0.16 }} className="flex size-6 items-center justify-center rounded-full bg-[#04ACAB] text-center text-[13px] leading-5 font-bold text-white">
                {per}
              </motion.span>
            </button>
          );
        })}
      </div>
      <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">
        {finished ? "" : filled.length === 0 ? "Tap a row to put its chairs in." : `${filled.length} of ${rows} rows filled.`}
      </p>
      {finished && after}
    </div>
  );
}

/** A small green tick in the corner of a key that has been looked at. */
function SeenTick() {
  return (
    <span aria-hidden className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#01A17F] ring-2 ring-white dark:ring-[#0F1F26]">
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export type SymbolItem = {
  id: string;
  /** What is on the big button: "+", "//", ">=". */
  symbol: string;
  /** What it means. */
  title: string;
  /** An example of it in use. */
  example?: string;
  /** The example read aloud, as a sentence. */
  say?: string;
  /** What the example comes to, where it is a comparison (True or False). */
  result?: boolean;
};

export type SymbolGroup = { title?: string; items: readonly SymbolItem[]; columns: number };

/** The colours of a group's keys (the first group teal, a second violet, a third orange): the key, its 3D edge, and its title. */
const KEY_COLORS = [
  { key: "bg-[#08A4AD] shadow-[0_3px_0_#067F86]", title: "text-[#08A4AD]", dot: "bg-[#08A4AD]" },
  { key: "bg-[#7B61FF] shadow-[0_3px_0_#5B3FD0]", title: "text-[#7B61FF]", dot: "bg-[#7B61FF]" },
  { key: "bg-[#E8743B] shadow-[0_3px_0_#B85A28]", title: "text-[#E8743B]", dot: "bg-[#E8743B]" },
] as const;

/**
 * Big symbols to tap: each shows what it means with an example (and how it reads
 * aloud, and whether it is True). It is done once `need` of them have been tapped
 * (all, by default). `header` draws something above that follows the symbol
 * last tapped, `footer` shows once it is done.
 */
export function SymbolStage({
  api,
  groups,
  need,
  header,
  footer,
  big = true,
  prompt = "Tap each symbol.",
}: {
  api: InteractionApi;
  groups: readonly SymbolGroup[];
  need?: number;
  header?: (current: SymbolItem | null) => ReactNode;
  footer?: ReactNode;
  big?: boolean;
  /** What the card says before anything is tapped. */
  prompt?: string;
}) {
  const { done, finished } = api;
  const all = groups.flatMap((group) => group.items);
  const required = need ?? all.length;
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = all.find((item) => item.id === currentId) ?? null;

  // The symbols stay tappable after it is done, so the learner can keep exploring.
  const tap = (item: SymbolItem) => {
    playClickSound();
    vibrateForTap();
    setCurrentId(item.id);
    const next = seen.includes(item.id) ? seen : [...seen, item.id];
    setSeen(next);
    if (next.length === required && !seen.includes(item.id)) window.setTimeout(() => done(), 900);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      {header?.(current)}
      {groups.map((group, index) => {
        const colors = KEY_COLORS[index % KEY_COLORS.length];
        return (
          <div key={index} className="flex w-full flex-col gap-1.5">
            {group.title && (
              <span className={`flex items-center gap-1.5 text-[12px] leading-4 font-bold tracking-[0.4px] uppercase ${groups.length > 1 ? colors.title : "text-[#6B7480] dark:text-white/60"}`}>
                <span className={`size-1.5 rounded-full ${groups.length > 1 ? colors.dot : "bg-[#6B7480]"}`} />
                {group.title}
              </span>
            )}
            <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${group.columns}, minmax(0, 1fr))` }}>
              {group.items.map((item) => {
                const tapped = seen.includes(item.id);
                const selected = currentId === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => tap(item)}
                    animate={{ scale: selected ? [1, 0.92, 1.08, 1] : 1 }}
                    transition={{ duration: 0.35 }}
                    whileTap={{ scale: 0.94, y: 2 }}
                    className={`relative flex cursor-pointer items-center justify-center rounded-[12px] px-1 leading-none font-bold text-white transition-shadow ${item.symbol.length <= 4 ? "font-mono" : ""} ${
                      item.symbol.length > 6 ? "h-[56px] text-[17px]" : big ? "h-[56px] text-[28px]" : "h-[44px] text-[20px]"
                    } ${selected ? "bg-[#FFB300] shadow-[0_3px_0_#C98A00,0_0_0_4px_rgba(255,179,0,0.28)]" : colors.key}`}
                  >
                    {item.symbol}
                    {tapped && !selected && <SeenTick />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex min-h-[78px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex w-full flex-col items-center gap-0.5 rounded-[12px] border-2 px-3 py-2 text-center ${
              current
                ? `bg-white shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] ${current.result === undefined ? "border-transparent" : current.result ? "border-[#01A17F]/40" : "border-[#D42421]/40"}`
                : "border-transparent"
            }`}
          >
            {current ? (
              <>
                <span className="text-[15px] leading-5 font-bold text-[#2F5D59] dark:text-[#BFE6E2]">{current.title}</span>
                {current.example && (
                  <span className="flex items-center gap-2 font-mono text-[18px] leading-6 font-bold text-[#444444] dark:text-white">
                    {current.example}
                    {current.result !== undefined && (
                      <span className={`flex items-center gap-1 rounded-full px-2.5 font-sans text-[13px] leading-5 font-bold text-white ${current.result ? "bg-[#01A17F]" : "bg-[#D42421]"}`}>
                        <span aria-hidden>{current.result ? "✓" : "✕"}</span>
                        {current.result ? "True" : "False"}
                      </span>
                    )}
                  </span>
                )}
                {current.say && <span className="text-[13px] leading-5 font-medium text-[#6B7480] italic dark:text-white/70">&ldquo;{current.say}&rdquo;</span>}
              </>
            ) : (
              <span className="text-[14px] leading-5 font-medium text-[#6B7480] dark:text-white/60">{prompt}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {finished && footer}
    </div>
  );
}

export type Step = { /** Which blocks of the expression are picked out. */ lit: readonly number[]; text: string; result?: string };

/**
 * An expression worked out one step at a time: each tap of the button picks out
 * the part being worked on and says what happens to it. Done at the last step.
 */
export function StepStage({ api, tokens, steps, after }: { api: InteractionApi; tokens: readonly string[]; steps: readonly Step[]; after?: ReactNode }) {
  const { done, finished } = api;
  const [at, setAt] = useState(-1);
  const step = at >= 0 ? steps[at] : null;
  const last = at === steps.length - 1;

  const next = () => {
    if (last || finished) return;
    playClickSound();
    vibrateForTap();
    const to = at + 1;
    setAt(to);
    if (to === steps.length - 1) window.setTimeout(() => done(), 1100);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      <div className={`flex w-full flex-col items-center gap-2 px-3 py-3 ${CARD} ${WHITE}`}>
        <ExprBig tokens={tokens} lit={step?.lit ?? []} result={step?.result} />
        <div className="flex items-center gap-1.5" aria-hidden>
          {steps.map((_, index) => (
            <span key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index <= at ? "w-5 bg-[#08A4AD]" : "w-1.5 bg-[#D5DAE1] dark:bg-white/20"}`} />
          ))}
        </div>
        <p className={`flex min-h-[44px] w-full items-center justify-center rounded-[10px] px-3 py-1.5 text-center text-[15px] leading-[22px] font-semibold transition-colors ${step ? "bg-[#EAF7F6] text-[#2F5D59] dark:bg-[#0F2B28] dark:text-[#BFE6E2]" : "text-[#6B7480] dark:text-white/60"}`}>
          {step ? step.text : "Tap the button to see the steps."}
        </p>
      </div>
      {!last && (
        <button type="button" onClick={next} className={PILL}>
          {at < 0 ? "Show the steps" : "Next step"}
        </button>
      )}
      {finished && after}
    </div>
  );
}

/**
 * Put the steps in order: tap them one after another. A right one gets its
 * number and stays; a wrong one shakes red with a hint (and counts as a slip).
 * Done when all are in place.
 */
export function OrderStage({
  api,
  steps,
  shown,
  hint,
  lead,
}: {
  api: InteractionApi;
  /** The steps, in the right order. */
  steps: readonly string[];
  /** The order they are shown in (positions in `steps`). */
  shown: readonly number[];
  hint: string;
  lead?: ReactNode;
}) {
  const { slip, done, finished } = api;
  const [got, setGot] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const tap = (index: number) => {
    if (finished || got.includes(index)) return;
    playClickSound();
    vibrateForTap();
    if (index === got.length) {
      setNote("");
      const next = [...got, index];
      setGot(next);
      if (next.length === steps.length) window.setTimeout(() => done(), 600);
      return;
    }
    slip();
    setNote(hint);
    setWrong(index);
    window.setTimeout(() => setWrong(null), WRONG_MS);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-2.5">
      {lead}
      <div className="flex w-full flex-col gap-1.5">
        {shown.map((index) => {
          const place = got.indexOf(index);
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => tap(index)}
              animate={{ x: wrong === index ? SHAKE : 0 }}
              transition={{ duration: 0.4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex min-h-[46px] cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left ${CARD_FACE} ${RAISED} ${place >= 0 ? LOOKS.correct.edge : wrong === index ? LOOKS.wrong.edge : EDGE.khaki} ${place >= 0 ? LOOKS.correct.card : wrong === index ? LOOKS.wrong.card : CREAM}`}
            >
              <motion.span
                key={place >= 0 ? "placed" : "open"}
                initial={place >= 0 ? { scale: 0.5 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 16 }}
                className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-[14px] leading-none font-bold ${place >= 0 ? "bg-[#01A17F] text-white shadow-[0_2px_0_#018066]" : "border-2 border-dashed border-[#C9CED6] text-transparent"}`}
              >
                {place >= 0 ? place + 1 : ""}
              </motion.span>
              <span className="text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{steps[index]}</span>
            </motion.button>
          );
        })}
      </div>
      <Note>{note || <span className="text-[#6B7480] dark:text-white/60">{finished ? "" : "Tap the steps in the order they happen."}</span>}</Note>
    </div>
  );
}

/** The pastels the scenes' cards take in turn. */
const SCENE_TINTS = [TINT.lavender, TINT.cream, TINT.mint, TINT.blue] as const;

/** A picture card to tap that shows a line under the row (used for "tap each scene"). */
export type SceneItem = { id: string; pic: string; label: string; caption: string };

/**
 * Scenes to explore: tap each one and a line says what is going on in it. Done
 * once all have been tapped.
 */
export function ScenesStage({ api, scenes, columns = 2, prompt = "Tap each scene." }: { api: InteractionApi; scenes: readonly SceneItem[]; columns?: 2 | 4; /** What the line says before anything is tapped. */ prompt?: string }) {
  const { done, finished } = api;
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = scenes.find((scene) => scene.id === currentId);

  const tap = (scene: SceneItem) => {
    if (finished) return;
    playClickSound();
    vibrateForTap();
    setCurrentId(scene.id);
    const next = seen.includes(scene.id) ? seen : [...seen, scene.id];
    setSeen(next);
    if (next.length === scenes.length && !seen.includes(scene.id)) window.setTimeout(() => done(), 900);
  };

  return (
    <div className="pointer-events-auto flex w-[340px] flex-col items-center gap-3">
      <div className={`grid w-full gap-2.5 ${columns === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
        {scenes.map((scene, index) => (
          <motion.button
            key={scene.id}
            type="button"
            onClick={() => tap(scene)}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: currentId === scene.id ? [1, 0.95, 1.05, 1.03] : 1 }}
            transition={{ duration: 0.35, delay: currentId === scene.id ? 0 : index * 0.08 }}
            whileTap={{ scale: 0.97 }}
            aria-pressed={currentId === scene.id}
            className={`relative flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[10px] border-4 px-2 py-2 ${RAISED} ${SCENE_TINTS[index % SCENE_TINTS.length]} ${currentId === scene.id ? `border-[#08A4AD] ${EDGE.teal}` : `border-white dark:border-transparent ${EDGE.khaki}`}`}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:bg-[#15181E]">
              <Pic src={scene.pic} className="size-9" />
            </span>
            <span className="text-[13px] leading-4 font-bold text-[#444444] dark:text-white">{scene.label}</span>
            {seen.includes(scene.id) && <SeenBadge className="top-1 right-1" />}
          </motion.button>
        ))}
      </div>
      <div className="flex min-h-[48px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={current?.id ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[12px] px-3 py-2 text-center text-[15px] leading-5 font-semibold ${current ? "bg-white text-[#2F5D59] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-[#BFE6E2]" : "text-[#6B7480] dark:text-white/60"}`}
          >
            {current ? current.caption : prompt}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
