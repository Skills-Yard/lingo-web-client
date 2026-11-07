"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";
import { CARD, CREAM, LAVENDER, Pic, WHITE } from "@/components/datatypes/visuals";
import { P } from "./pictures";

export { CARD, CREAM, LAVENDER, Pic, WHITE };

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
          {index > 0 && between && <span className="text-[16px] leading-6 font-bold text-[#08A4AD]">{between}</span>}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.3, duration: 0.35 }}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1.5 py-2 ${CARD} ${TONE[item.tone ?? "plain"]}`}
          >
            {item.pic && <Pic src={item.pic} className="h-8 w-8" />}
            <span className="text-center text-[11px] leading-4 font-semibold tracking-[0.3px] text-[#6B7480] uppercase dark:text-white/60">{item.label}</span>
            {item.value && <span className="text-center text-[19px] leading-6 font-bold text-[#444444] dark:text-white">{item.value}</span>}
          </motion.div>
        </Fragment>
      ))}
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
      <Pic src={P.money} className="h-12 w-12" />
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

/** A big expression, with some of its parts picked out and, if it has one, its result. `tight` keeps it on one line. */
export function ExprBig({ tokens, lit = [], result, size = 34, tight = false }: { tokens: readonly string[]; lit?: readonly number[]; result?: string; size?: number; tight?: boolean }) {
  return (
    <div className={`flex items-center justify-center font-bold text-[#444444] dark:text-white ${tight ? "flex-nowrap gap-x-0.5 whitespace-nowrap" : "flex-wrap gap-x-2"}`} style={{ fontSize: size, lineHeight: 1.2 }}>
      {tokens.map((token, index) => (
        <span key={index} className={`rounded-md px-1 transition-colors ${lit.includes(index) ? "bg-[#FFD36B] text-[#444444]" : ""}`}>
          {token}
        </span>
      ))}
      {result !== undefined && <span className="text-[#08A4AD]">= {result}</span>}
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

/** Chocolates (or anything) set out in groups of `size`: the complete groups, and what is left over. */
export function GroupsPicture({ total, size, replay = 0 }: { total: number; size: number; replay?: number }) {
  const groups = Math.floor(total / size);
  const left = total % size;
  return (
    <div key={replay} className="flex w-[316px] flex-wrap items-center justify-center gap-2">
      {Array.from({ length: groups }, (_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + index * 0.25 }}
          className="rounded-[10px] border-2 border-[#04ACAB] bg-[#E3F6F3] p-1.5 dark:bg-[#0F2B28]"
        >
          <Pile count={size} columns={Math.min(size, 6)} />
        </motion.div>
      ))}
      {left > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + groups * 0.25 }}
          className="rounded-[10px] border-2 border-dashed border-[#FFB300] bg-[#FFF8E1] p-1.5 dark:bg-[#2A2218]"
        >
          <Pile count={left} columns={Math.min(left, 6)} />
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
        className={`rounded-full px-4 py-0.5 text-[16px] leading-6 font-bold text-white ${result ? "bg-[#01A17F]" : "bg-[#D42421]"}`}
      >
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
        ["Students", "32", P.student],
        ["Per bus", "10", P.person],
        ["Cost per bus", "₹2,000", P.money],
        ["Budget", "₹7,000", P.gift],
      ].map(([label, value, pic]) => (
        <div key={label} className={`flex items-center gap-2 px-2 py-1 ${CARD} ${LAVENDER}`}>
          <Pic src={pic} className="h-7 w-7" />
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
        <div key={what} className="flex items-center justify-between text-[14px] leading-5 font-medium text-[#444444] dark:text-white">
          <span>{what}</span>
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
