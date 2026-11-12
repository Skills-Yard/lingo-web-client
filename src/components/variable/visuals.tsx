"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, AnimatePresence, motion } from "framer-motion";
import { Calculator as CalculatorIcon } from "lucide-react";

/** A card, in the style of the picture cards of the other modules. */
export const CARD =
  "rounded-[16px] border-4 border-white bg-[#F6F4FE] shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent dark:bg-[#0F1F26]";

/** A number that counts up or down to `value` when it changes. */
export function Counter({ value, prefix = "", suffix = "", seconds = 1.1 }: { value: number; prefix?: string; suffix?: string; seconds?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const controls = animate(from.current, value, {
      duration: seconds,
      ease: "easeInOut",
      onUpdate: (latest) => {
        from.current = latest;
        setShown(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, seconds]);
  return (
    <span className="tabular-nums">
      {prefix}
      {shown.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/**
 * A value that starts at `from` and moves to `to` after `delayMs`: for a visual
 * that shows something happening (water poured in) when the screen opens or
 * when `replay` changes (the learner tries a question again).
 */
export function useChange(from: number, to: number, delayMs = 800, replay = 0) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    const reset = window.setTimeout(() => setValue(from), 0);
    const change = window.setTimeout(() => setValue(to), delayMs);
    return () => {
      window.clearTimeout(reset);
      window.clearTimeout(change);
    };
  }, [from, to, delayMs, replay]);
  return value;
}

/** A value that goes through `points` in turn (each at `at` ms from the start), and starts over when `replay` changes. */
export function useTimeline(points: readonly { at: number; value: number }[], replay = 0) {
  const [value, setValue] = useState(points[0].value);
  useEffect(() => {
    const timers = points.map((point) => window.setTimeout(() => setValue(point.value), point.at));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // `points` is written inline by the caller; what it says is what `replay` stands for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay]);
  return value;
}

/* ───────────────────────── The bottle ───────────────────────── */

const BOTTLE_PATH = "M62 22H88V50C88 62 124 66 124 96V222Q124 244 102 244H48Q26 244 26 222V96C26 66 62 62 62 50Z";
const WATER_BOTTOM = 240;
/** How tall (in the bottle's own 150 x 260 box) each ml of the 1,000 is. */
const PER_ML = 0.14;
const waterY = (ml: number, capacity: number) => WATER_BOTTOM - Math.max(0, Math.min(ml, capacity)) * (1000 / capacity) * PER_ML;

/**
 * A clear bottle with its capacity marked, filled to `ml`. The water level moves
 * smoothly when `ml` changes, so the amount can be watched going up and down.
 * `tag` is a name label on the bottle; `stream` pours water in from above.
 */
export function Bottle({
  ml,
  capacity = 1000,
  tag,
  stream = false,
  marks = true,
  height = 170,
  tint = "#4FC3F7",
}: {
  ml: number;
  capacity?: number;
  tag?: string;
  stream?: boolean;
  marks?: boolean;
  height?: number;
  tint?: string;
}) {
  const y = waterY(ml, capacity);
  const id = `bottle-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden viewBox="0 0 150 260" style={{ height, width: (height * 150) / 260 }} className="shrink-0 overflow-visible">
      <defs>
        <clipPath id={id}>
          <path d={BOTTLE_PATH} />
        </clipPath>
      </defs>
      <path d={BOTTLE_PATH} fill="rgba(255,255,255,0.55)" />
      <g clipPath={`url(#${id})`}>
        <motion.rect x={0} width={150} fill={tint} fillOpacity={0.85} initial={false} animate={{ y, height: WATER_BOTTOM + 10 - y }} transition={{ duration: 1.1, ease: "easeInOut" }} />
        <motion.rect x={0} width={150} height={3} fill="#fff" fillOpacity={0.55} initial={false} animate={{ y }} transition={{ duration: 1.1, ease: "easeInOut" }} />
      </g>
      <path d={BOTTLE_PATH} fill="none" stroke="#8D9BAA" strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={58} y={4} width={34} height={20} rx={5} fill="#08A4AD" />
      {marks &&
        [0.25, 0.5, 0.75, 1].map((share) => {
          const markY = WATER_BOTTOM - share * 1000 * PER_ML;
          return (
            <g key={share}>
              <line x1={124} x2={136} y1={markY} y2={markY} stroke="#8D9BAA" strokeWidth={2} strokeLinecap="round" />
              <text x={140} y={markY + 3.5} fontSize={10} fontWeight={600} fill="#6B7480">
                {Math.round(share * capacity)}
              </text>
            </g>
          );
        })}
      {tag && (
        <g>
          <rect x={36} y={136} width={78} height={30} rx={7} fill="#fff" stroke="#08A4AD" strokeWidth={2.5} />
          <text x={75} y={156} textAnchor="middle" fontSize={15} fontWeight={700} fill="#2B2B2B">
            {tag}
          </text>
        </g>
      )}
      <AnimatePresence>
        {stream && (
          <motion.rect
            key="stream"
            x={70}
            width={10}
            rx={5}
            fill={tint}
            initial={{ y: -40, height: 0, opacity: 0 }}
            animate={{ y: -40, height: 66, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
}

/* ───────────────────────── Money ───────────────────────── */

/** A wallet showing an amount; a note of what changed floats up from it. */
export function Wallet({ amount, caption = "Pocket money", note }: { amount: number; caption?: string; note?: { text: string; gain: boolean } | null }) {
  return (
    <div className={`relative flex w-[200px] flex-col items-center gap-1 px-4 py-3 ${CARD}`}>
      <span aria-hidden className="text-[40px] leading-none">
        👛
      </span>
      <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{caption}</span>
      <span className="text-[30px] leading-9 font-bold text-[#08A4AD]">
        <Counter value={amount} prefix="₹" />
      </span>
      <AnimatePresence>
        {note && (
          <motion.span
            key={note.text}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: [0, 1, 1, 0], y: [12, -4, -14, -30] }}
            transition={{ duration: 1.8, times: [0, 0.2, 0.7, 1] }}
            className={`absolute -top-3 right-2 rounded-full px-2.5 py-0.5 text-[14px] leading-5 font-bold text-white ${note.gain ? "bg-[#01A17F]" : "bg-[#E5484D]"}`}
          >
            {note.text}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/** An item to buy, with its price on a tag. */
export function ShopItem({ emoji, name, price, tint = "bg-[#F6F4FE]" }: { emoji: string; name: string; price: number; tint?: string }) {
  return (
    <div className={`relative flex w-[92px] flex-col items-center gap-0.5 rounded-[14px] border-4 border-white px-2 pt-3 pb-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent dark:bg-[#0F1F26] ${tint}`}>
      <span aria-hidden className="text-[34px] leading-none">
        {emoji}
      </span>
      <span className="text-[13px] leading-4 font-semibold text-[#444444] dark:text-white">{name}</span>
      <span className="mt-1 rounded-full bg-[#FFB300] px-2.5 py-0.5 text-[13px] leading-4 font-bold text-white shadow-[0_2px_0_#D98E00]">₹{price}</span>
    </div>
  );
}

/* ───────────────────────── The classroom ───────────────────────── */

/** A classroom of `total` students, `present` of them in their seats; the rest are empty. */
export function Classroom({ present, total = 30 }: { present: number; total?: number }) {
  return (
    <div className={`flex w-[212px] flex-wrap justify-center gap-1 p-2 ${CARD}`}>
      {Array.from({ length: total }, (_, index) => {
        const here = index < present;
        return (
          <motion.span
            key={index}
            aria-hidden
            initial={false}
            animate={{ scale: here ? 1 : 0.9, opacity: here ? 1 : 0.45 }}
            transition={{ duration: 0.4 }}
            className={`flex size-[18px] items-center justify-center rounded-full text-[11px] leading-none ${here ? "bg-[#CDEFEA] dark:bg-[#0F2B28]" : "border-2 border-dashed border-[#B9C2D0] dark:border-white/30"}`}
          >
            {here ? "🧑‍🎓" : ""}
          </motion.span>
        );
      })}
    </div>
  );
}

/** The attendance board: three counts, each with what it counts. */
export function AttendanceBoard({ total, present, absent, names = false }: { total: number; present: number; absent: number; names?: boolean }) {
  const rows = [
    { label: names ? "total_students" : "Total students", value: total },
    { label: names ? "present_students" : "Present", value: present },
    { label: names ? "absent_students" : "Absent", value: absent },
  ];
  return (
    <div className={`flex w-[116px] flex-col gap-1.5 bg-white p-2.5 dark:bg-[#15181E] ${CARD}`}>
      <span className="text-center text-[11px] leading-4 font-bold tracking-[0.5px] text-[#6B7480] uppercase dark:text-white/60">Attendance</span>
      {rows.map((row) => (
        <div key={row.label} className={names ? "flex flex-col" : "flex items-baseline justify-between gap-1"}>
          <span className={`font-medium text-[#6B7480] dark:text-white/60 ${names ? "font-mono text-[9px] leading-3" : "text-[10px] leading-3"}`}>{row.label}</span>
          <span className="text-[17px] leading-5 font-bold text-[#444444] dark:text-white">
            <Counter value={row.value} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Small apps ───────────────────────── */

/** The addition app the learner is about to plan: two number fields, an Add button and a result. `compact` is the short version, for where there is little room. */
export function CalculatorApp({
  first = "",
  second = "",
  result = "",
  highlight = false,
  compact = false,
}: {
  first?: string;
  second?: string;
  result?: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  const field = (value: string, label: string) => (
    <div className={`flex items-center justify-between rounded-lg border-2 border-[#D5DADF] bg-white px-3 dark:border-white/20 dark:bg-[#15181E] ${compact ? "h-7" : "h-10"}`}>
      <span className="text-[11px] leading-4 font-medium text-[#8A94A0]">{label}</span>
      <span className={`font-semibold text-[#444444] dark:text-white ${compact ? "text-[14px] leading-5" : "text-[18px] leading-6"}`}>{value || " "}</span>
    </div>
  );
  return (
    <div className={`flex w-[230px] flex-col ${compact ? "gap-1.5 p-2" : "gap-2 p-3"} ${CARD}`}>
      {!compact && (
        <span className="flex items-center gap-1.5 text-[12px] leading-4 font-bold text-[#6B7480] dark:text-white/60">
          <CalculatorIcon aria-hidden className="size-4 text-[#08A4AD]" /> Add two numbers
        </span>
      )}
      {field(first, "First number")}
      {field(second, "Second number")}
      <span className={`flex items-center justify-center rounded-lg bg-[#08A4AD] font-semibold text-white shadow-[0_3px_0_#067F86] ${compact ? "h-[26px] text-[12px] leading-4" : "h-9 text-[14px] leading-5"}`}>Add</span>
      <div
        className={`flex items-center justify-between rounded-lg border-2 px-3 ${compact ? "h-7" : "h-10"} ${highlight ? "border-[#E5484D] bg-[#FDECEC] dark:bg-[#2E1517]" : "border-dashed border-[#B9C2D0] dark:border-white/25"}`}
      >
        <span className="text-[11px] leading-4 font-medium text-[#8A94A0]">Result</span>
        <span className={`font-bold ${compact ? "text-[14px] leading-5" : "text-[18px] leading-6"} ${highlight ? "text-[#D42421]" : "text-[#444444] dark:text-white"}`}>{result || " "}</span>
      </div>
    </div>
  );
}
