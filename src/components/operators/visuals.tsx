"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";
import { CARD, CARD_FACE, CREAM, LAVENDER, Pic, WHITE } from "@/components/datatypes/visuals";
import { P } from "./pictures";

export { CARD, CARD_FACE, CREAM, LAVENDER, Pic, WHITE };

/** A piece of information as a named card: what it is, and its value. */
export type ValueCard = { pic?: string; label: string; value?: string; tone?: "plain" | "good" | "warn" };

const TONE = {
  plain: LAVENDER,
  good: "bg-[#E3F6F3] dark:bg-[#0F2B28]",
  warn: "bg-[#FFF4E3] dark:bg-[#4A3418]",
} as const;

/**
 * Cards in a row, each a named block of information (as in the Variables
 * chapter): a picture, the name, the value. A sign can stand between two
 * cards ("+", "vs").
 */
export function ValueCards({ items, between, replay = 0, width = 316 }: { items: readonly ValueCard[]; between?: string; replay?: number; width?: number }) {
  return (
    <div key={replay} className="flex items-center justify-center gap-1.5" style={{ width }}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && between && (
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.3 - 0.1, type: "spring", stiffness: 300, damping: 18 }}
              className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#08A4AD] px-1.5 text-[12px] leading-none font-bold text-white shadow-[0_2px_0_#067F86]"
            >
              {between}
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1.5 py-2 ${CARD} ${TONE[item.tone ?? "plain"]}`}
          >
            {item.pic && (
              <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#15181E]">
                <Pic src={item.pic} className="size-6" />
              </span>
            )}
            <span className="text-center text-[11px] leading-4 font-semibold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">{item.label}</span>
            {item.value && <span className="text-center text-[19px] leading-6 font-bold text-[#444444] dark:text-white">{item.value}</span>}
          </motion.div>
        </Fragment>
      ))}
    </div>
  );
}

/** A flat notebook, drawn here until the module has art of its own. */
export function NotebookIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <rect x="6" y="3" width="20" height="26" rx="3" fill="#4C8DFF" />
      <rect x="6" y="3" width="5" height="26" rx="2.5" fill="#2F6FE0" />
      <rect x="14" y="9" width="9" height="2.5" rx="1.25" fill="white" opacity="0.95" />
      <rect x="14" y="14" width="9" height="2.5" rx="1.25" fill="white" opacity="0.65" />
      <rect x="14" y="19" width="6" height="2.5" rx="1.25" fill="white" opacity="0.65" />
    </svg>
  );
}

/** A flat pen, drawn here until the module has art of its own. */
export function PenIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <g transform="rotate(45 16 16)">
        <rect x="13" y="3" width="6" height="19" rx="2" fill="#FF8A3D" />
        <rect x="13" y="3" width="6" height="5" rx="2" fill="#E8743B" />
        <path d="M13 22h6l-3 7z" fill="#FFD9B8" />
        <path d="M15 26.5h2l-1 2.5z" fill="#444444" />
      </g>
    </svg>
  );
}

/** A flat shopping bag, drawn here until the module has art of its own. */
export function BagIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
      <path d="M11 11V9a5 5 0 0 1 10 0v2" fill="none" stroke="#C25E1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M6 11h20l-1.6 15.2A2.5 2.5 0 0 1 21.9 28H10.1a2.5 2.5 0 0 1-2.5-1.8z" fill="#FF8A3D" />
      <path d="M6 11h20l-.4 3.5H6.4z" fill="#E8743B" />
    </svg>
  );
}

/** A line of the information sheet: its picture, what it is, its value. */
export type InfoRow = { icon: ReactNode; label: string; value: string };

/** What is still to be found: its picture and name, and its value once it is known (until then a "?"). */
export type InfoMissing = { icon: ReactNode; label: string; value?: string };

/** The delay of the sheet's n-th line coming in. */
const rowIn = (index: number) => ({ delay: 0.15 + index * 0.25, duration: 0.35 });

/**
 * What we know, as one sheet: a line to a piece of information (picture, name,
 * value), and under it, if there is one, a dashed line for what we do not have
 * yet. The lines come in one after the other; once the missing value is given
 * the dashed line turns into a solid one with the answer in it. `compact` drops
 * the heading and tightens the lines, for a screen with something to do under it.
 */
export function InfoSheet({
  title = "What we know",
  rows,
  missing,
  compact = false,
  replay = 0,
}: {
  title?: string;
  rows: readonly InfoRow[];
  missing?: InfoMissing;
  compact?: boolean;
  replay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const found = missing?.value !== undefined;
  const icon = compact ? "size-8 p-1" : "size-9 p-1.5";
  const label = compact ? "text-[13px] leading-5" : "text-[14px] leading-5";
  const value = compact ? "text-[18px] leading-6" : "text-[20px] leading-6";
  const pad = compact ? "py-1" : "py-1.5";
  return (
    <div key={replay} className={`flex w-[316px] flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
      {!compact && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1.5 self-start rounded-full bg-[#E3F6F3] py-1 pr-3 pl-1.5 text-[11px] leading-4 font-bold tracking-[0.5px] text-[#08A4AD] uppercase dark:bg-[#0F2B28]"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-[#08A4AD]">
            <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          {title}
        </motion.span>
      )}
      <div className={`flex flex-col px-3 ${CARD} ${LAVENDER}`}>
        {rows.map((row, index) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={rowIn(index)}
            className={`flex items-center gap-3 ${pad} ${index > 0 ? "border-t border-[#E4DFF7] dark:border-white/10" : ""}`}
          >
            <span className={`flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#15181E] ${icon}`}>{row.icon}</span>
            <span className={`flex-1 font-semibold text-[#6B7480] dark:text-white/60 ${label}`}>{row.label}</span>
            <span className={`font-bold text-[#444444] dark:text-white ${value}`}>{row.value}</span>
          </motion.div>
        ))}
      </div>
      {missing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rowIn(rows.length)}
          className={`flex items-center gap-3 rounded-[8px] border-2 px-4 transition-colors duration-300 ${pad} ${found ? "border-[#08A4AD] bg-[#E3F6F3] dark:bg-[#0F2B28]" : "border-dashed border-[#08A4AD]/60 bg-white/70 dark:bg-[#15181E]/70"}`}
        >
          <span className={`flex shrink-0 items-center justify-center rounded-full ${icon} ${found ? "bg-white dark:bg-[#15181E]" : "bg-[#E3F6F3] dark:bg-[#0F2B28]"}`}>
            <span className={`flex size-full items-center justify-center transition-[opacity,filter] duration-300 ${found ? "" : "opacity-40 grayscale"}`}>{missing.icon}</span>
          </span>
          <span className={`flex-1 font-semibold text-[#6B7480] dark:text-white/60 ${label}`}>{missing.label}</span>
          {found ? (
            <motion.span key="found" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className={`font-bold text-[#04908F] ${value}`}>
              {missing.value}
            </motion.span>
          ) : (
            <motion.span
              key="unknown"
              animate={reducedMotion ? undefined : { scale: [1, 1.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="text-[22px] leading-6 font-bold text-[#08A4AD]"
            >
              ?
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
}

/**
 * A wallet with an amount; a second amount comes in (or goes out) after a
 * moment. The new total only shows with `showTotal` (once the learner has
 * answered), so the scene doesn't give the answer away.
 */
export function WalletScene({ amount, change, showTotal = false, replay = 0 }: { amount: number; change: { sign: "+" | "-"; value: number }; showTotal?: boolean; replay?: number }) {
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setMoved(true), 1300);
    return () => {
      window.clearTimeout(timer);
      setMoved(false);
    };
  }, [replay]);
  const now = change.sign === "+" ? amount + change.value : amount - change.value;
  return (
    <div className={`relative flex w-[316px] items-center gap-3 px-4 py-2.5 ${CARD} ${CREAM}`}>
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:bg-[#15181E]">
        <Pic src={P.iconWallet} className="size-10" />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[11px] leading-4 font-semibold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">Wallet</span>
        <span className="text-[26px] leading-8 font-bold text-[#444444] dark:text-white">₹{moved && showTotal ? now : amount}</span>
      </div>
      <motion.span
        key={`${replay}-${moved}`}
        initial={{ opacity: 0, x: 40, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: moved ? 0 : 0.6, type: "spring", stiffness: 220, damping: 16 }}
        className={`rounded-full px-3 py-1 text-[16px] leading-6 font-bold text-white ${change.sign === "+" ? "bg-[#01A17F]" : "bg-[#E8743B]"}`}
      >
        {change.sign} ₹{change.value}
      </motion.span>
    </div>
  );
}

/** Symbols and the words `and`, `or`, `not` are operators (drawn teal); numbers and names are values. */
export const isOperator = (token: string) => /^([+\-*/%<>=!()]+|and|or|not)$/.test(token);

/**
 * A big expression: the operators in teal, the parts being worked on picked out
 * on a yellow pad, and, if it has one, its result in a teal pill. `tight` keeps
 * it on one line.
 */
export function ExprBig({ tokens, lit = [], result, size = 34, tight = false }: { tokens: readonly string[]; lit?: readonly number[]; result?: string; size?: number; tight?: boolean }) {
  return (
    <div className={`flex items-center justify-center font-bold text-[#444444] dark:text-white ${tight ? "flex-nowrap gap-x-0.5 whitespace-nowrap" : "flex-wrap gap-x-2"}`} style={{ fontSize: size, lineHeight: 1.2 }}>
      {tokens.map((token, index) => (
        <span
          key={index}
          className={`rounded-lg px-1.5 transition-[background-color,box-shadow] duration-200 ${
            lit.includes(index) ? "bg-[#FFD36B] text-[#444444] shadow-[0_2px_0_#E0A81C]" : isOperator(token) ? "text-[#08A4AD]" : ""
          }`}
        >
          {token}
        </span>
      ))}
      {result !== undefined && (
        <motion.span key={result} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="rounded-lg bg-[#E3F6F3] px-2 text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FE0D6]">
          = {result}
        </motion.span>
      )}
    </div>
  );
}

/** Two things to compare, side by side, each with a picture and a label. */
export function Versus({ left, right, replay = 0 }: { left: ValueCard; right: ValueCard; replay?: number }) {
  return <ValueCards items={[left, right]} between="vs" replay={replay} />;
}

/** Two expressions side by side, each on its own card. */
export function SideBySide({ left, right }: { left: readonly string[]; right: readonly string[] }) {
  return (
    <div className="flex w-[316px] items-stretch justify-center gap-2">
      {[left, right].map((tokens, index) => (
        <div key={index} className={`flex flex-1 items-center justify-center px-2 py-3 ${CARD} ${LAVENDER}`}>
          <ExprBig tokens={tokens} size={19} tight />
        </div>
      ))}
    </div>
  );
}

/** One chocolate. */
export function Choc({ lit = false }: { lit?: boolean }) {
  return (
    <span
      className={`block size-[13px] rounded-[4px] border transition-colors ${lit ? "border-[#FFB300] bg-[#FFD36B]" : "border-[#6B4226] bg-[#8B5A3C]"}`}
      style={{ boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.25)" }}
    />
  );
}

/** A heap of chocolates (or any count of them), a few to a row. */
export function Pile({ count, lit = 0, columns = 10 }: { count: number; lit?: number; columns?: number }) {
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${Math.min(columns, Math.max(count, 1))}, 13px)` }}>
      {Array.from({ length: count }, (_, index) => (
        <Choc key={index} lit={index >= count - lit} />
      ))}
    </div>
  );
}

/** A student's tray: its name, what is in it. */
export function Tray({ label, count, lit = false, children }: { label: string; count: number; lit?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[10px] border-2 px-1 py-1.5 transition-colors ${lit ? "border-[#FFB300] bg-[#FFF8E1] dark:bg-[#2A2218]" : "border-[#B8A9F5] bg-[#F1EEFF] dark:bg-[#2E2A5C]"}`}>
      <span className="flex size-7 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#15181E]">
        <Pic src={P.student} className="size-5" />
      </span>
      <span className="text-[11px] leading-4 font-bold text-[#5B3FD0] dark:text-[#A79BFF]">{label}</span>
      <div className="flex min-h-[28px] items-center justify-center">{children ?? <Pile count={count} columns={5} />}</div>
      <span className="text-[16px] leading-5 font-bold text-[#444444] dark:text-white">{count}</span>
    </div>
  );
}

/** The chocolates in a heap, and the students' trays (counts of each). */
export function ShareScene({ pile, trays, label = "Student" }: { pile: number; trays: readonly number[]; label?: string }) {
  return (
    <div className="flex w-[316px] flex-col items-center gap-2">
      <div className={`flex min-h-[44px] items-center justify-center px-3 py-2 ${CARD} ${CREAM}`} style={{ minWidth: 150 }}>
        {pile > 0 ? <Pile count={pile} /> : <span className="text-[12px] font-semibold text-[#6B7480]">No chocolates left</span>}
      </div>
      <div className="flex w-full gap-1.5">
        {trays.map((count, index) => (
          <Tray key={index} label={`${label} ${index + 1}`} count={count} />
        ))}
      </div>
    </div>
  );
}

/**
 * Chocolates (or anything) set out in groups of `size`: the complete groups, and
 * what is left over. `emphasis` picks out one part and fades the other; `still`
 * shows the groups at once, without bringing them in.
 */
export function GroupsPicture({
  total,
  size,
  replay = 0,
  emphasis = "all",
  still = false,
}: {
  total: number;
  size: number;
  replay?: number;
  emphasis?: "all" | "groups" | "left";
  still?: boolean;
}) {
  const groups = Math.floor(total / size);
  const left = total % size;
  const entrance = (delay: number) => ({ initial: still ? false : { opacity: 0, scale: 0.7 }, animate: { opacity: 1, scale: 1 }, transition: { delay } }) as const;
  const fade = (faded: boolean) => `transition-opacity duration-300 ${faded ? "opacity-30" : ""}`;
  return (
    <div key={replay} className="flex w-[316px] flex-wrap items-center justify-center gap-2">
      {Array.from({ length: groups }, (_, index) => (
        <motion.div key={index} {...entrance(0.15 + index * 0.25)}>
          <div className={`rounded-[10px] border-2 border-[#04ACAB] bg-[#E3F6F3] p-1.5 dark:bg-[#0F2B28] ${fade(emphasis === "left")}`}>
            <Pile count={size} columns={Math.min(size, 6)} />
          </div>
        </motion.div>
      ))}
      {left > 0 && (
        <motion.div {...entrance(0.15 + groups * 0.25)}>
          <div className={`rounded-[10px] border-2 border-dashed border-[#FFB300] bg-[#FFF8E1] p-1.5 dark:bg-[#2A2218] ${fade(emphasis === "groups")}`}>
            <Pile count={left} columns={Math.min(left, 6)} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/** A square garden: rows by columns of plants; the rows (then the columns) light up in turn. */
export function PlantGrid({ rows = 4, cols = 4, replay = 0 }: { rows?: number; cols?: number; replay?: number }) {
  const [lit, setLit] = useState<{ kind: "row" | "col"; index: number } | null>(null);
  useEffect(() => {
    const timers: number[] = [];
    for (let index = 0; index < rows; index += 1) timers.push(window.setTimeout(() => setLit({ kind: "row", index }), 700 + index * 450));
    for (let index = 0; index < cols; index += 1) timers.push(window.setTimeout(() => setLit({ kind: "col", index }), 700 + (rows + index) * 450));
    timers.push(window.setTimeout(() => setLit(null), 700 + (rows + cols) * 450));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setLit(null);
    };
  }, [rows, cols, replay]);
  return (
    <div className={`grid gap-1 p-2 ${CARD} ${CREAM}`} style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}>
      {Array.from({ length: rows * cols }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const on = !!lit && (lit.kind === "row" ? lit.index === row : lit.index === col);
        return (
          <span key={index} className={`flex size-8 items-center justify-center rounded-md transition-colors ${on ? "bg-[#FFD36B]" : "bg-transparent"}`}>
            <Pic src={P.plant} className="h-7 w-7" />
          </span>
        );
      })}
    </div>
  );
}

/** A number line of `marks`, with some of them picked out; an optional gate (or limit) stands at one of them. */
export function LineScale({
  marks,
  picked = [],
  second = [],
  gate,
  gateLabel,
  small = false,
}: {
  marks: readonly number[];
  picked?: readonly number[];
  second?: readonly number[];
  gate?: number;
  gateLabel?: string;
  small?: boolean;
}) {
  const size = small ? 26 : 38;
  return (
    <div className={`flex w-[316px] flex-col items-center gap-1 px-2 pt-2 pb-3 ${CARD} ${WHITE}`}>
      <div className="relative flex w-full items-end justify-between" style={{ height: gate !== undefined ? 66 : size + 6 }}>
        {marks.map((mark) => (
          <div key={mark} className="relative flex flex-1 flex-col items-center justify-end gap-1">
            {gate === mark && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] leading-3 font-bold text-[#E8743B]">{gateLabel ?? "Gate"}</span>
                <span className="h-[22px] w-[3px] rounded bg-[#E8743B]" />
              </div>
            )}
            <span
              className={`flex items-center justify-center rounded-full border-2 font-bold transition-colors ${
                picked.includes(mark)
                  ? "border-[#04ACAB] bg-[#08A4AD] text-white"
                  : second.includes(mark)
                    ? "border-[#E8743B] bg-[#FFB267] text-white"
                    : "border-[#C9CED6] bg-white text-[#6B7480] dark:bg-[#15181E] dark:text-white/70"
              }`}
              style={{ width: size, height: size, fontSize: small ? 11 : 15 }}
            >
              {mark}
            </span>
          </div>
        ))}
      </div>
      <div className="flex w-full items-center">
        <span className="h-[3px] flex-1 rounded bg-[#C9CED6]" />
        <span className="border-y-[5px] border-l-[8px] border-y-transparent border-l-[#C9CED6]" />
      </div>
    </div>
  );
}

/** A comparison as the computer sees it: two number blocks either side of a symbol, then the result. */
export function CompareDemo({ left, symbol, right, result, replay = 0 }: { left: string; symbol: string; right: string; result: boolean; replay?: number }) {
  return (
    <div key={`${left}${symbol}${right}${replay}`} className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`min-w-[56px] px-3 py-1.5 text-center text-[26px] leading-8 font-bold text-[#444444] dark:text-white ${CARD} ${LAVENDER}`}>
          {left}
        </motion.span>
        <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="min-w-[56px] rounded-[10px] bg-[#08A4AD] px-3 py-1.5 text-center text-[26px] leading-8 font-bold text-white shadow-[0_3px_0_#067F86]">
          {symbol}
        </motion.span>
        <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`min-w-[56px] px-3 py-1.5 text-center text-[26px] leading-8 font-bold text-[#444444] dark:text-white ${CARD} ${LAVENDER}`}>
          {right}
        </motion.span>
      </div>
      <motion.span
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`flex items-center gap-1.5 rounded-full px-4 py-0.5 text-[16px] leading-6 font-bold text-white ${result ? "bg-[#01A17F] shadow-[0_2px_0_#018066]" : "bg-[#D42421] shadow-[0_2px_0_#A31B19]"}`}
      >
        <span aria-hidden>{result ? "✓" : "✕"}</span>
        {result ? "True" : "False"}
      </motion.span>
    </div>
  );
}

/** A level gate that is open or locked, with the score that was tried at it. */
export function GateCard({ score, open }: { score: number; open: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${CARD} ${open ? "bg-[#E3F6F3] dark:bg-[#0F2B28]" : "bg-[#FFF4E3] dark:bg-[#4A3418]"}`}>
      {open ? <LockOpen aria-hidden className="size-7 text-[#01A17F]" /> : <Lock aria-hidden className="size-7 text-[#E8743B]" />}
      <span className="text-[22px] leading-7 font-bold text-[#444444] dark:text-white">{score}</span>
      <span className="text-[16px] leading-6 font-bold text-[#444444] dark:text-white">{open ? "Unlocked" : "Locked"}</span>
    </div>
  );
}

/** The class trip's facts, as small cards. */
export function TripFacts() {
  return (
    <div className="grid w-[316px] grid-cols-2 gap-1.5">
      {[
        ["Students", "32", P.student, "bg-[#F6F4FE] dark:bg-[#1F1B3A]"],
        ["Per bus", "10", P.person, "bg-[#E6F0FF] dark:bg-[#15213A]"],
        ["Cost per bus", "₹2,000", P.iconWallet, "bg-[#FFF6EA] dark:bg-[#3A2C14]"],
        ["Budget", "₹7,000", P.iconMoney, "bg-[#EBF6F0] dark:bg-[#0F2B28]"],
      ].map(([label, value, pic, tint]) => (
        <div key={label} className={`flex items-center gap-2 px-2 py-1.5 ${CARD} ${tint}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#15181E]">
            <Pic src={pic} className="size-6" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] leading-3 font-semibold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">{label}</span>
            <span className="text-[16px] leading-5 font-bold text-[#444444] dark:text-white">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A shopping bill: lines of what was bought, and the amount shown at the bottom. */
export function BillCard({ lines, total, wrong = false }: { lines: readonly (readonly [string, string])[]; total: string; wrong?: boolean }) {
  return (
    <div className={`flex w-[316px] flex-col gap-1 px-3 py-2 ${CARD} ${CREAM}`}>
      {lines.map(([what, price]) => (
        <div key={what} className="flex items-baseline gap-2 text-[14px] leading-5 font-medium text-[#444444] dark:text-white">
          <span>{what}</span>
          <span aria-hidden className="min-w-3 flex-1 border-b-2 border-dotted border-[#D9D2C4] dark:border-white/20" />
          <span className="font-semibold">{price}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t-2 border-dashed border-[#D9D2C4] pt-1 dark:border-white/20">
        <span className="text-[14px] leading-5 font-bold text-[#444444] dark:text-white">Bill shown</span>
        <span className={`rounded-full px-3 py-0.5 text-[17px] leading-6 font-bold text-white ${wrong ? "bg-[#D42421]" : "bg-[#01A17F]"}`}>{total}</span>
      </div>
    </div>
  );
}
