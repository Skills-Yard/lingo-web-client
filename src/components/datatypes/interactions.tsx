"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import { BounceIn } from "@/components/level-two/BounceIn";
import { playClickSound } from "@/components/onboarding/clickSound";
import { COLUMN_W } from "@/lib/questionColumn";
import { vibrateForTap } from "@/lib/haptics";
import { EDGE, RAISED, RAISED_DRAG } from "@/components/ui/raised";
import { CARD_BODY, CARD_BODY_FLAT, CARD_TEXT, EDGE_IDLE, EDGE_PICKED, EDGE_READING, EMPTY_SLOT, INK, RECEIVING, TINTS, tintAt, type GroupTint } from "./look";
import { P } from "./pictures";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";
import { WINDOW_ROW, WindowCard } from "./WindowCard";

/** The four data types, as the places things are sorted into and the chips they are chosen from. */
export const TYPES = [
  { id: "integer", label: "Integer", icon: P.integer },
  { id: "float", label: "Float", icon: P.float },
  { id: "string", label: "String", icon: P.string },
  { id: "boolean", label: "Boolean", icon: P.boolean },
] as const;

/** The width of what a stage draws, as the first screens' cards stand in it. */
const STAGE_W = "w-[354px]";
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
export const SHAKE = [0, -7, 7, -5, 5, 0];
/** A press that moves less than this far (px) is a tap, not a drag. */
const TAP_SLOP = 6;
/** A wrong card shakes red for this long (ms). */
export const WRONG_MS = 600;

/** The places things are sorted into: each its own coloured name box, as screen 4's groups have. */
const HEADS = [
  { tint: "lavender", ink: INK.violet },
  { tint: "cream", ink: INK.orange },
  { tint: "blue", ink: INK.blue },
  { tint: "green", ink: INK.teal },
] as const satisfies readonly { tint: GroupTint; ink: string }[];

/** A card that can be dragged, or tapped; it settles back where it was if it isn't dropped on a place. */
export function DragCard({
  children,
  className,
  style,
  disabled,
  onTap,
  onDrop,
  label,
}: {
  children: ReactNode;
  className: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  onTap: () => void;
  onDrop: (clientX: number, clientY: number) => void;
  label: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const drag = useRef<{ startX: number; startY: number; scale: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const home = () => {
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  };
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startY: event.clientY, scale: box.getBoundingClientRect().width / box.offsetWidth || 1, moved: false };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const now = drag.current;
        if (!now) return;
        const dx = event.clientX - now.startX;
        const dy = event.clientY - now.startY;
        if (Math.hypot(dx, dy) > TAP_SLOP) now.moved = true;
        x.set(dx / now.scale);
        y.set(dy / now.scale);
      }}
      onPointerUp={(event) => {
        const now = drag.current;
        drag.current = null;
        setDragging(false);
        if (!now) return;
        if (now.moved) onDrop(event.clientX, event.clientY);
        else onTap();
        home();
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        home();
      }}
      animate={{ scale: dragging ? 1.06 : 1 }}
      style={{ ...style, x, y, zIndex: dragging ? 5 : 1 }}
      className={`pointer-events-auto relative touch-none enabled:cursor-grab enabled:active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.button>
  );
}

export type SortItem = {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  /** The group it belongs to. */
  bucket: string;
  /** What is said when it is put in the wrong group. */
  hint?: string;
};
export type SortBucket = { id: string; label: string; icon?: string };

/**
 * Sorting: cards are dragged into groups (or a card is tapped, then the group).
 * A right drop stays and a wrong one shakes red and comes back with a hint (and
 * counts as a slip); the stage is done when everything is in its group. (Grouping
 * with no right answer is `GroupStage`.)
 */
export function SortStage({
  api,
  items,
  buckets,
  prompt = "Drag each card to its group.",
  cardWidth = 104,
  decimalHint = false,
  after,
}: {
  api: InteractionApi;
  items: readonly SortItem[];
  buckets: readonly SortBucket[];
  prompt?: string;
  cardWidth?: number;
  /** After a slip the decimal points in the cards are picked out. */
  decimalHint?: boolean;
  /** What shows once it is done. */
  after?: ReactNode;
}) {
  const { slip, done, finished } = api;
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [slipped, setSlipped] = useState(false);
  const bucketEls = useRef<Record<string, HTMLDivElement | null>>({});
  const all = items.length === Object.keys(placed).length;

  useEffect(() => {
    if (!all) return;
    const timer = window.setTimeout(done, 450);
    return () => window.clearTimeout(timer);
  }, [all, done]);

  const place = (id: string, bucket: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || finished) return;
    setSelected(null);
    if (item.bucket === bucket) {
      playClickSound();
      vibrateForTap();
      setNote("");
      setPlaced((now) => ({ ...now, [id]: bucket }));
      return;
    }
    slip();
    setSlipped(true);
    setWrongId(id);
    setNote(item.hint ?? "Not that group. Look again at what it is.");
    window.setTimeout(() => setWrongId(null), WRONG_MS);
  };

  const bucketAt = (clientX: number, clientY: number) =>
    buckets.find((bucket) => {
      const rect = bucketEls.current[bucket.id]?.getBoundingClientRect();
      return !!rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    });

  const labelOf = (item: SortItem) => {
    if (!decimalHint || !slipped || !item.label.includes(".")) return item.label;
    const [whole, decimal] = item.label.split(".");
    return (
      <>
        {whole}
        <span className="mx-px rounded bg-[#FFB300] px-0.5 text-white">.</span>
        {decimal}
      </>
    );
  };

  const tray = items.filter((item) => !placed[item.id]);
  const columns = buckets.length === 3 ? "grid-cols-3" : "grid-cols-2";
  const rows = Math.ceil(buckets.length / (buckets.length === 3 ? 3 : 2));

  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-4`}>
      <div className="flex min-h-[52px] flex-wrap justify-center gap-3.5">
        <AnimatePresence>
          {tray.map((item) => (
            <motion.div key={item.id} layout exit={{ opacity: 0, scale: 0.6 }} animate={{ x: wrongId === item.id ? SHAKE : 0 }} transition={{ x: { duration: 0.35 } }}>
              {/* The cards all share one tint: here a card's colour must not hint at its group. */}
              <DragCard
                label={item.label}
                disabled={finished}
                onTap={() => {
                  playClickSound();
                  setSelected((now) => (now === item.id ? null : item.id));
                }}
                onDrop={(clientX, clientY) => {
                  const target = bucketAt(clientX, clientY);
                  if (target) place(item.id, target.id);
                }}
                style={{ width: cardWidth }}
                className={`${CARD_BODY_FLAT} ${RAISED_DRAG} min-h-[52px] flex-col gap-0.5 px-1.5 py-1 ${
                  wrongId === item.id ? `${LOOKS.wrong.card} ${LOOKS.wrong.edge}` : `${TINTS.lavender} ${selected === item.id ? `${EDGE_PICKED} ${EDGE.blue}` : `${EDGE_IDLE} ${EDGE.khaki}`}`
                }`}
              >
                {item.icon && <Pic src={item.icon} className="h-7 w-7" />}
                <span className={CARD_TEXT}>{labelOf(item)}</span>
                {item.sub && <span className="text-[11px] leading-3 font-medium text-[#6B7480] dark:text-white/60">{item.sub}</span>}
              </DragCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={`grid w-full gap-3.5 ${columns}`}>
        {buckets.map((bucket, index) => {
          const head = HEADS[index % HEADS.length];
          const inside = items.filter((item) => placed[item.id] === bucket.id);
          return (
            <div
              key={bucket.id}
              ref={(element) => {
                bucketEls.current[bucket.id] = element;
              }}
              role="group"
              aria-label={bucket.label || `Group ${index + 1}`}
              onClick={() => selected && place(selected, bucket.id)}
              className={`flex flex-col gap-2 rounded-[12px] p-1.5 transition-colors ${selected ? RECEIVING : ""}`}
              style={{ minHeight: rows > 1 ? 120 : 176 }}
            >
              {/* The group's name box: 40 tall, 8px radius, Poppins 600 16px, in the group's own colour. */}
              <div className={`flex h-10 items-center justify-center gap-1.5 rounded-[8px] px-1.5 ${TINTS[head.tint]} ${head.ink}`}>
                {bucket.icon && <Pic src={bucket.icon} className="h-5 w-5" />}
                <span className="text-[16px] leading-none font-semibold">{bucket.label || `Group ${index + 1}`}</span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-1.5">
                {/* An empty group is a gray slot at its foot, where its first card will land. */}
                {inside.length === 0 && (
                  <div className={EMPTY_SLOT}>
                    <Pic src={P.dropSlot} className="h-6 w-6" />
                  </div>
                )}
                {inside.map((item) => (
                  // A card that is in its group stays (green): it takes no taps, so a tap on the group still reaches the group.
                  <motion.span
                    key={item.id}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`pointer-events-none ${CARD_BODY} min-h-[40px] px-2 py-1 text-center ${CARD_TEXT} ${TINTS.green} ${EDGE_IDLE}`}
                  >
                    {item.label}
                  </motion.span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="min-h-5 w-full text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {note || <span className="text-[#6B7480] dark:text-white/60">{finished ? "" : prompt}</span>}
      </p>
      {finished && after}
    </div>
  );
}

export type PickItem = { id: string; label: string; sub?: string; icon?: string };

/**
 * Tap the cards that fit: each right one turns green and stays; a wrong one
 * shakes red with a hint (and counts as a slip). It is done when every right
 * card has been tapped.
 */
export function MultiPickStage({
  api,
  items,
  correct,
  hint,
  columns = 2,
  footer,
}: {
  api: InteractionApi;
  items: readonly PickItem[];
  /** The ids of the cards that fit. */
  correct: readonly string[];
  hint: string;
  columns?: 2 | 3;
  /** What shows once it is done. */
  footer?: ReactNode;
}) {
  const { slip, done, finished } = api;
  const [got, setGot] = useState<readonly string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (got.length < correct.length) return;
    const timer = window.setTimeout(() => done(), 500);
    return () => window.clearTimeout(timer);
  }, [got, correct, done]);

  const tap = (id: string) => {
    if (finished || got.includes(id)) return;
    playClickSound();
    vibrateForTap();
    if (correct.includes(id)) {
      setNote("");
      setGot((now) => [...now, id]);
      return;
    }
    slip();
    setNote(hint);
    setWrongId(id);
    window.setTimeout(() => setWrongId(null), WRONG_MS);
  };

  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-3`}>
      <div className={`grid w-full gap-3.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => tap(item.id)}
            animate={{ x: wrongId === item.id ? SHAKE : 0, scale: got.includes(item.id) ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.35 }}
            whileTap={{ scale: 0.97 }}
            className={`${CARD_BODY_FLAT} ${RAISED} min-h-[64px] cursor-pointer flex-col gap-0.5 px-2 py-2 ${
              got.includes(item.id) ? `${LOOKS.correct.card} ${LOOKS.correct.edge}` : wrongId === item.id ? `${LOOKS.wrong.card} ${LOOKS.wrong.edge}` : `${tintAt(index)} ${EDGE_IDLE} ${EDGE.khaki}`
            }`}
          >
            {item.icon && <Pic src={item.icon} className="h-8 w-8" />}
            <span className={CARD_TEXT}>{item.label}</span>
            {item.sub && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{item.sub}</span>}
          </motion.button>
        ))}
      </div>
      <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]">{note}</p>
      {finished && footer}
    </div>
  );
}

/**
 * Tap the big picture cards (screen 6's four numbers, standing as in its first part)
 * that fit: each right one turns green and stays; a wrong one shakes red with a
 * hint (and counts as a slip). It is done when every right card has been tapped.
 * The cards bounce in once Hex has finished his line.
 */
export function PickTilesStage({
  api,
  tiles,
  correct,
  hint,
}: {
  api: InteractionApi;
  tiles: readonly InfoTile[];
  /** The ids of the cards that fit. */
  correct: readonly string[];
  hint: string;
}) {
  const { slip, done, finished, hexSpoken } = api;
  const [got, setGot] = useState<readonly string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (got.length < correct.length) return;
    const timer = window.setTimeout(() => done(), 600);
    return () => window.clearTimeout(timer);
  }, [got, correct, done]);

  const tap = (id: string) => {
    if (finished || got.includes(id)) return;
    playClickSound();
    vibrateForTap();
    if (correct.includes(id)) {
      setNote("");
      setGot((now) => [...now, id]);
      return;
    }
    slip();
    setNote(hint);
    setWrongId(id);
    window.setTimeout(() => setWrongId(null), WRONG_MS);
  };

  const look = INFO_LAYOUT.grid;
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <div className={look.box} style={{ width: COLUMN_W }}>
        {tiles.map((tile, index) => (
          <BounceIn key={tile.id} index={index} shown={hexSpoken} className="flex min-w-0 flex-1">
            <motion.button
              type="button"
              onClick={() => tap(tile.id)}
              animate={{ x: wrongId === tile.id ? SHAKE : 0, scale: got.includes(tile.id) ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              className={`${CARD_BODY} min-w-0 flex-1 cursor-pointer flex-col px-1.5 ${look.card} ${
                got.includes(tile.id) ? LOOKS.correct.card : wrongId === tile.id ? LOOKS.wrong.card : `${tile.tint} ${EDGE_IDLE}`
              }`}
            >
              <InfoTileBody tile={tile} layout="grid" />
            </motion.button>
          </BounceIn>
        ))}
      </div>
      <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]">{note}</p>
    </div>
  );
}

export type RevealItem = { id: string; label: string; sub?: string; icon?: string; caption: string };

/**
 * Tap the cards to find out what each one is: its meaning shows under them. It
 * is done once `need` of them have been tapped (all, by default); `header` draws
 * something above them that follows the card last tapped, and `footer` shows
 * once it is done.
 */
export function RevealStage({
  api,
  items,
  need = items.length,
  columns = 2,
  header,
  footer,
  tone,
}: {
  api: InteractionApi;
  items: readonly RevealItem[];
  need?: number;
  columns?: 2 | 3 | 5;
  header?: (current: string | null) => ReactNode;
  footer?: ReactNode;
  /** All the cards in this tint; without it they go round the four tints, as screen 3's cards do. */
  tone?: GroupTint;
}) {
  const { done, finished } = api;
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (seen.length < need) return;
    const timer = window.setTimeout(() => done(), 700);
    return () => window.clearTimeout(timer);
  }, [seen, need, done]);

  const grid = columns === 5 ? "grid-cols-5" : columns === 3 ? "grid-cols-3" : "grid-cols-2";
  const shown = items.find((item) => item.id === current);
  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-3`}>
      {header?.(current)}
      <div className={`grid w-full ${columns === 5 ? "gap-2" : "gap-3.5"} ${grid}`}>
        {items.map((item, index) => {
          const tapped = seen.includes(item.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => {
                playClickSound();
                vibrateForTap();
                setCurrent(item.id);
                setSeen((now) => (now.includes(item.id) ? now : [...now, item.id]));
              }}
              animate={{ scale: current === item.id ? [1, 0.96, 1.03, 1] : 1 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              // The card being read has screen 4's green-teal edge; one that has been read keeps its tint and gets a small tick.
              className={`${CARD_BODY_FLAT} ${RAISED} relative min-h-[64px] cursor-pointer flex-col gap-0.5 px-1 py-1.5 ${tone ? TINTS[tone] : tintAt(index)} ${current === item.id ? `${EDGE_READING} ${EDGE.mint}` : `${EDGE_IDLE} ${EDGE.khaki}`}`}
            >
              {tapped && <Check aria-hidden className="absolute top-0.5 right-0.5 size-3.5 text-[#10B48C]" strokeWidth={3} />}
              {item.icon && <Pic src={item.icon} className="h-7 w-7" />}
              <span className={CARD_TEXT}>{item.label}</span>
              {item.sub && <span className="text-[11px] leading-3 font-medium text-[#6B7480] dark:text-white/60">{item.sub}</span>}
            </motion.button>
          );
        })}
      </div>
      <div className="flex min-h-[48px] w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={shown?.id ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[12px] px-3 py-2 text-center text-[15px] leading-5 font-semibold ${shown ? "bg-white text-[#444444] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-white" : "text-[#6B7480] dark:text-white/60"}`}
          >
            {shown ? shown.caption : "Tap each card."}
          </motion.p>
        </AnimatePresence>
      </div>
      {finished && footer}
    </div>
  );
}

export type ToggleItem = { id: string; title: string; on: string; off: string; icon: string };

/** Tap each picture to switch it between its two states; it is done once each has been switched. */
export function ToggleStage({ api, items }: { api: InteractionApi; items: readonly ToggleItem[] }) {
  const { done } = api;
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((item) => [item.id, true])));
  const [flipped, setFlipped] = useState<readonly string[]>([]);

  useEffect(() => {
    if (flipped.length < items.length) return;
    const timer = window.setTimeout(() => done(), 700);
    return () => window.clearTimeout(timer);
  }, [flipped, items, done]);

  return (
    <div className={`pointer-events-auto grid ${STAGE_W} grid-cols-2 gap-3.5`}>
      {items.map((item, index) => {
        const on = state[item.id];
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => {
              playClickSound();
              vibrateForTap();
              setState((now) => ({ ...now, [item.id]: !now[item.id] }));
              setFlipped((now) => (now.includes(item.id) ? now : [...now, item.id]));
            }}
            whileTap={{ scale: 0.96 }}
            className={`${CARD_BODY_FLAT} ${RAISED} min-h-[110px] cursor-pointer flex-col gap-1 px-2 py-2 ${tintAt(index)} ${EDGE_IDLE} ${EDGE.khaki}`}
          >
            <Pic src={item.icon} className="h-10 w-10" />
            <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{item.title}</span>
            <motion.span
              key={String(on)}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full px-3 py-0.5 text-[14px] leading-5 font-bold text-white ${on ? "bg-[#01A17F]" : "bg-[#8A94A0]"}`}
            >
              {on ? item.on : item.off}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** A field marked as having the wrong type: tap the type it should have. */
export function ChooseTypeStage({
  api,
  field,
  value,
  from,
  correct,
  hint,
}: {
  api: InteractionApi;
  field: string;
  value: string;
  from: string;
  correct: string;
  hint: string;
}) {
  const { slip, done, finished } = api;
  const [wrong, setWrong] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const choose = (id: string) => {
    if (finished) return;
    playClickSound();
    vibrateForTap();
    if (id === correct) {
      setChosen(id);
      window.setTimeout(() => done(), 500);
      return;
    }
    slip();
    setWrong(id);
    window.setTimeout(() => setWrong(null), WRONG_MS);
  };
  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-4`}>
      <WindowCard title={field} icon={<FileText />} panel="pt-3.5 pr-[21px] pb-4 pl-[21px]">
        <div className={`flex h-[48px] items-center justify-between px-4 ${WINDOW_ROW}`}>
          <span className="text-[22px] leading-7 font-bold text-[#151E48] dark:text-white">{value}</span>
          <span className="rounded-full bg-[#E3F6F3] px-3 py-0.5 text-[12px] leading-4 font-semibold text-[#04908F] dark:bg-[#0F2B28]">
            {chosen ? TYPES.find((type) => type.id === chosen)?.label : from}
          </span>
        </div>
      </WindowCard>
      <div className="grid w-full grid-cols-2 gap-3.5">
        {TYPES.map((type, index) => (
          <motion.button
            key={type.id}
            type="button"
            onClick={() => choose(type.id)}
            animate={{ x: wrong === type.id ? SHAKE : 0 }}
            transition={{ duration: 0.35 }}
            whileTap={{ scale: 0.97 }}
            className={`${CARD_BODY_FLAT} ${RAISED} h-[64px] cursor-pointer gap-2 px-2 ${
              chosen === type.id ? `${LOOKS.correct.card} ${LOOKS.correct.edge}` : wrong === type.id ? `${LOOKS.wrong.card} ${LOOKS.wrong.edge}` : `${tintAt(index)} ${EDGE_IDLE} ${EDGE.khaki}`
            }`}
          >
            <Pic src={type.icon} className="h-8 w-8" />
            <span className={CARD_TEXT}>{type.label}</span>
          </motion.button>
        ))}
      </div>
      <p className="min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]">{wrong ? hint : ""}</p>
    </div>
  );
}
