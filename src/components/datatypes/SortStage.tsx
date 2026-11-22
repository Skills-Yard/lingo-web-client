"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import { RightBounce } from "@/components/level-two/RightBounce";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED_DRAG } from "@/components/ui/raised";
import { OPTION } from "@/components/variable/quiz";
import { vibrateForTap } from "@/lib/haptics";
import { SHAKE, WRONG_MS } from "./interactions";
import { INK } from "./look";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";

/**
 * Matching a field to its data type, built like the Variable module's drag screens: the places (empty dashed spots) stand on
 * top, two across, each with its type's name on a little tab attached to its top edge (the spot itself stays empty), and the
 * fields to drag stand under them, so a field is always dragged from the bottom up. A field is dragged onto a spot, or tapped
 * and then the spot is tapped. A right match goes in at once (it bounces, and is locked there); a wrong one shakes red, comes
 * back, and says why (and counts as a slip). It is done when every field is in its spot.
 */

export type SortItem = {
  id: string;
  label: string;
  /** The spot (type) it belongs in. Each spot takes one field. */
  bucket: string;
  /** What is said when it is put in the wrong spot. */
  hint?: string;
};
export type SortBucket = { id: string; label: string; icon?: string };

/** The width of the board (px): the Variable module's 340px column, two spots across. */
const BOARD_W = 340;
const GAP = OPTION.gap;
const CARD_W = (BOARD_W - GAP) / 2;
const CARD_H = OPTION.height;
/** The type's tab on a spot's top edge. */
const TAB_H = 26;
/** From the spots to the fields under them (px). */
const LANE = 30;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
/** A press that moves less than this far (px) is a tap, not a drag. */
const TAP_SLOP = 6;
/** A card that is dropped this near a spot (px) counts as on it. */
const REACH = 10;
/** A tap shows the card sunk onto its edge for at least this long (ms), even if it is let go at once. */
const MIN_PRESS_MS = 160;
/** A right match bounces this long (s) after it is dropped, once it has glided into its spot. */
const BOUNCE_AFTER_S = 0.35;
/** What is shown on the card in its spot, then the main button, after the last right match (ms). */
const DONE_AFTER_MS = 500;

/** The card held down: its face has sunk onto its raised edge (see `RAISED`). */
const PRESSED = "translate-y-1 shadow-[0_0_0_var(--edge)]";
/** The fields' face, as the Variable module's draggable names have it: pale mint, one thin grey line, the raised edge under it. */
const CARD_FACE = "border-2 border-[#D2D8DE] bg-[#E3F6F3] dark:border-white/20 dark:bg-[#0F2B28]";

/** The tabs: each type's own tint and ink, going round in the order of the spots. */
const TABS = [
  { fill: "bg-[#ECE8FF] dark:bg-[#1E1A3A]", ink: INK.violet },
  { fill: "bg-[#FFEBCC] dark:bg-[#33260F]", ink: INK.orange },
  { fill: "bg-[#DCE9FF] dark:bg-[#15233A]", ink: INK.blue },
  { fill: "bg-[#DDF3E2] dark:bg-[#10261A]", ink: INK.teal },
] as const;

type Point = { x: number; y: number };

/** A field: pressed and dragged by hand (the stage is scaled as one piece, so the pointer's screen px are converted to its own), or tapped. It rests at `at` and glides there. */
function FieldCard({
  label,
  at,
  placed,
  selected,
  wrong,
  disabled,
  onDrop,
  onTap,
}: {
  label: string;
  at: Point;
  placed: boolean;
  selected: boolean;
  wrong: boolean;
  disabled: boolean;
  onDrop: (clientX: number, clientY: number) => void;
  onTap: () => void;
}) {
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; moved: boolean; at: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // A tap is let go in an instant: the sunk look is held for a moment so it still shows.
  const [held, setHeld] = useState(false);
  const releaseTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, SPRING), animate(y, at.y, SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

  const release = (startedAt: number) => {
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => setHeld(false), Math.max(0, MIN_PRESS_MS - (performance.now() - startedAt)));
  };

  const state = wrong ? "wrong" : placed ? "correct" : selected ? "selected" : "idle";
  const face = state === "idle" ? `${CARD_FACE} ${EDGE.khaki}` : `border-4 ${LOOKS[state].card} ${LOOKS[state].edge}`;

  return (
    <motion.div className="absolute top-0 left-0" style={{ x, y, width: CARD_W, height: CARD_H, zIndex: dragging ? 3 : 2 }}>
      <RightBounce play={placed} delay={BOUNCE_AFTER_S} radius={OPTION.radius} className="size-full">
        <motion.button
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-pressed={selected}
          onPointerDown={(event) => {
            const box = event.currentTarget;
            box.setPointerCapture(event.pointerId);
            drag.current = { startX: event.clientX, startY: event.clientY, fromX: x.get(), fromY: y.get(), scale: box.getBoundingClientRect().width / box.offsetWidth || 1, moved: false, at: performance.now() };
            setDragging(true);
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
          onPointerUp={(event) => {
            const now = drag.current;
            drag.current = null;
            setDragging(false);
            if (!now) return;
            release(now.at);
            if (now.moved) onDrop(event.clientX, event.clientY);
            else onTap();
            // Back to its place if nothing changed; a match gets to its spot through `at`.
            animate(x, at.x, SPRING);
            animate(y, at.y, SPRING);
          }}
          onPointerCancel={() => {
            const now = drag.current;
            drag.current = null;
            setDragging(false);
            if (now) release(now.at);
            animate(x, at.x, SPRING);
            animate(y, at.y, SPRING);
          }}
          // Picking it bounces it like the module's answer buttons; it is pressed (not grown) while held.
          animate={{ scale: selected ? [1, 0.95, 1.05, 1] : 1, x: wrong ? SHAKE : 0 }}
          transition={{ scale: { duration: 0.4, ease: "easeOut" }, x: { duration: 0.35 } }}
          style={{ borderRadius: OPTION.radius }}
          className={`pointer-events-auto relative isolate flex size-full touch-none items-center justify-center overflow-hidden px-2 transition-[translate,box-shadow] duration-100 ease-out enabled:cursor-grab enabled:active:cursor-grabbing ${
            dragging || held ? PRESSED : RAISED_DRAG
          } ${face}`}
        >
          <span className="text-center leading-5 font-semibold text-[#444444] dark:text-white" style={{ fontSize: OPTION.font }}>
            {label}
          </span>
        </motion.button>
      </RightBounce>
    </motion.div>
  );
}

export function SortStage({
  api,
  items,
  buckets,
  prompt = "Drag a field up to its type, or tap it first.",
}: {
  api: InteractionApi;
  items: readonly SortItem[];
  buckets: readonly SortBucket[];
  prompt?: string;
}) {
  const { slip, done, finished } = api;
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const spotEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const all = items.every((item) => placed[item.id]);

  useEffect(() => {
    if (!all) return;
    const timer = window.setTimeout(done, DONE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [all, done]);

  // Where everything stands on the board (px): the spots two across with a tab above each, then the fields two across (a last one on its own is centred).
  const spotRows = Math.ceil(buckets.length / 2);
  const spotsHeight = spotRows * (TAB_H + CARD_H) + (spotRows - 1) * GAP;
  const spot = (index: number): Point => ({ x: (index % 2) * (CARD_W + GAP), y: Math.floor(index / 2) * (TAB_H + CARD_H + GAP) + TAB_H });
  const trayRows = Math.ceil(items.length / 2);
  const home = (index: number): Point => {
    const alone = index === items.length - 1 && items.length % 2 === 1;
    return { x: alone ? (BOARD_W - CARD_W) / 2 : (index % 2) * (CARD_W + GAP), y: spotsHeight + LANE + Math.floor(index / 2) * (CARD_H + GAP) };
  };
  const boardHeight = spotsHeight + LANE + trayRows * CARD_H + (trayRows - 1) * GAP;

  const place = (id: string, bucket: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || finished || placed[id]) return;
    setSelected(null);
    // A spot takes one field.
    if (Object.values(placed).includes(bucket)) return;
    if (item.bucket === bucket) {
      playClickSound();
      vibrateForTap();
      setNote("");
      setPlaced((now) => ({ ...now, [id]: bucket }));
      return;
    }
    slip();
    setWrongId(id);
    setNote(item.hint ?? "Not that type. Look again at what it holds.");
    window.setTimeout(() => setWrongId(null), WRONG_MS);
  };

  /** The spot under a pointer (a little leeway round it), if any. */
  const spotAt = (clientX: number, clientY: number) =>
    buckets.find((bucket) => {
      const rect = spotEls.current[bucket.id]?.getBoundingClientRect();
      return !!rect && clientX >= rect.left - REACH && clientX <= rect.right + REACH && clientY >= rect.top - REACH && clientY <= rect.bottom + REACH;
    });

  const taken = new Set(Object.values(placed));

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3 pt-2" style={{ width: BOARD_W }}>
      <div className="relative" style={{ width: BOARD_W, height: boardHeight }}>
        {buckets.map((bucket, index) => {
          const at = spot(index);
          const tab = TABS[index % TABS.length];
          const open = !!selected && !taken.has(bucket.id);
          return (
            <div key={bucket.id}>
              <button
                ref={(element) => {
                  spotEls.current[bucket.id] = element;
                }}
                type="button"
                aria-label={bucket.label}
                disabled={!open}
                onClick={() => selected && place(selected, bucket.id)}
                className={`absolute border-2 border-dashed transition-colors duration-200 ${open ? "cursor-pointer border-[#01A17F] bg-[#E3F6F3]/70 dark:bg-[#0F2B28]/70" : "border-[#9AA3AE] bg-white/70 dark:border-white/30 dark:bg-white/5"}`}
                style={{ left: at.x, top: at.y, width: CARD_W, height: CARD_H, borderRadius: OPTION.radius }}
              />
              {/* The type's name on a tab hanging off the spot's top edge, its curved corners up, its foot over the dashed line: it belongs to the spot, which stays empty for the field. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute flex items-center justify-center gap-1.5 rounded-t-[14px] px-3.5 ${tab.fill} ${tab.ink}`}
                style={{ left: at.x + CARD_W / 2, top: at.y - TAB_H + 2, height: TAB_H, transform: "translateX(-50%)" }}
              >
                {bucket.icon && <Pic src={bucket.icon} className="h-4 w-4" />}
                <span className="text-[14px] leading-none font-semibold">{bucket.label}</span>
              </span>
            </div>
          );
        })}
        {/* Each field's plain shadow, left in its place in the tray from the start: the card covers it, and it shows once the card has left. */}
        {items.map((item, index) => (
          <span key={`shadow-${item.id}`} aria-hidden className="pointer-events-none absolute" style={{ left: home(index).x, top: home(index).y, width: CARD_W, height: CARD_H, borderRadius: OPTION.radius, backgroundColor: "rgba(0,0,0,0.09)" }} />
        ))}
        {items.map((item, index) => {
          const spotIndex = buckets.findIndex((bucket) => bucket.id === placed[item.id]);
          return (
            <FieldCard
              key={item.id}
              label={item.label}
              at={spotIndex >= 0 ? spot(spotIndex) : home(index)}
              placed={spotIndex >= 0}
              selected={selected === item.id}
              wrong={wrongId === item.id}
              disabled={finished || spotIndex >= 0}
              onDrop={(clientX, clientY) => {
                const target = spotAt(clientX, clientY);
                if (target) place(item.id, target.id);
              }}
              onTap={() => {
                playClickSound();
                setNote("");
                setSelected((now) => (now === item.id ? null : item.id));
              }}
            />
          );
        })}
      </div>

      <p className="min-h-5 w-full text-center text-[13px] leading-5 font-medium text-[#D42421]">
        {note || <span className="text-[#6B7480] dark:text-white/60">{finished ? "" : selected ? "Now tap the type it belongs to." : prompt}</span>}
      </p>
    </div>
  );
}
