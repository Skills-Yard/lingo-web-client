"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { CARD, LAVENDER, WHITE } from "@/components/operators/visuals";

/** A question going into a check and coming out as True or False (`result` undefined: not known yet). */
export function CheckFlow({ question, result, replay = 0 }: { question: string; result?: boolean; replay?: number }) {
  return (
    <div key={replay} className="flex w-[316px] items-center gap-1.5">
      <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className={`flex min-h-[48px] flex-1 items-center justify-center px-2 py-1.5 text-center text-[14px] leading-5 font-semibold text-[#444444] dark:text-white ${CARD} ${LAVENDER}`}>
        {question}
      </motion.div>
      <span className="text-[#08A4AD]">→</span>
      <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-[10px] bg-[#08A4AD] px-2.5 py-3 text-[12px] leading-4 font-bold text-white shadow-[0_3px_0_#067F86]">
        CHECK
      </motion.div>
      <span className="text-[#08A4AD]">→</span>
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className={`min-w-[56px] rounded-full px-2.5 py-1 text-center text-[14px] leading-5 font-bold text-white ${result === undefined ? "bg-[#8A94A0]" : result ? "bg-[#01A17F]" : "bg-[#D42421]"}`}
      >
        {result === undefined ? "?" : result ? "True" : "False"}
      </motion.span>
    </div>
  );
}

/** The two possible results, as cards. */
export function ResultCards() {
  return (
    <div className="flex w-[316px] gap-2.5">
      {[
        { label: "True", good: true },
        { label: "False", good: false },
      ].map((card) => (
        <div key={card.label} className={`flex flex-1 items-center justify-center gap-2 px-2 py-2 ${CARD} ${card.good ? "bg-[#E3F6F3] dark:bg-[#0F2B28]" : "bg-[#FDECEC] dark:bg-[#3A1A1A]"}`}>
          {card.good ? <Check aria-hidden className="size-6 text-[#01A17F]" strokeWidth={3} /> : <X aria-hidden className="size-6 text-[#D42421]" strokeWidth={3} />}
          <span className="text-[18px] leading-6 font-bold text-[#444444] dark:text-white">{card.label}</span>
        </div>
      ))}
    </div>
  );
}

/** The number line around zero (-5 to 5): the numbers after zero, or before it, picked out. */
export function ZeroLine({ side }: { side: "positive" | "negative" | "none" }) {
  const marks = Array.from({ length: 11 }, (_, index) => index - 5);
  return (
    <div className={`flex w-[316px] flex-col items-center gap-1 px-2 pt-2 pb-2 ${CARD} ${WHITE}`}>
      <div className="flex w-full items-center justify-between">
        {marks.map((mark) => {
          const tone =
            mark === 0
              ? "border-[#444444] bg-[#444444] text-white"
              : mark > 0 && side === "positive"
                ? "border-[#04ACAB] bg-[#08A4AD] text-white"
                : mark < 0 && side === "negative"
                  ? "border-[#E8743B] bg-[#FFB267] text-white"
                  : "border-[#C9CED6] bg-white text-[#6B7480] dark:bg-[#15181E] dark:text-white/70";
          return (
            <span key={mark} className={`flex size-[26px] items-center justify-center rounded-full border-2 text-[11px] leading-none font-bold transition-colors ${tone}`}>
              {mark}
            </span>
          );
        })}
      </div>
      <div className="flex w-full items-center">
        <span className="border-y-[5px] border-r-[8px] border-y-transparent border-r-[#C9CED6]" />
        <span className="h-[3px] flex-1 bg-[#C9CED6]" />
        <span className="border-y-[5px] border-l-[8px] border-y-transparent border-l-[#C9CED6]" />
      </div>
      <div className="flex w-full justify-between text-[11px] leading-4 font-bold uppercase">
        <span className="text-[#E8743B]">Before zero</span>
        <span className="text-[#04908F]">After zero</span>
      </div>
    </div>
  );
}

/**
 * A number line with a range on it: the numbers from `low` to `high` highlighted,
 * each end a filled circle (included) or an open one (not included). With
 * `outside`, the numbers outside the range are highlighted instead.
 */
export function RangeLine({ min = 5, max = 25, low, high, lowOpen = false, highOpen = false, outside = false, ticks }: { min?: number; max?: number; low: number; high: number; lowOpen?: boolean; highOpen?: boolean; outside?: boolean; ticks?: readonly number[] }) {
  const at = (value: number) => `${((value - min) / (max - min)) * 100}%`;
  const labelled = ticks ?? [min, low, high, max];
  const band = outside ? "bg-[#FFB267]" : "bg-[#08A4AD]";
  return (
    <div className={`flex w-[316px] flex-col px-6 pt-3 pb-1 ${CARD} ${WHITE}`}>
      <div className="relative h-[26px] w-full">
        <span className="absolute top-1/2 h-[4px] w-full -translate-y-1/2 rounded bg-[#C9CED6]" />
        {outside ? (
          <>
            <span className={`absolute top-1/2 h-[6px] -translate-y-1/2 rounded ${band}`} style={{ left: 0, width: at(low) }} />
            <span className={`absolute top-1/2 h-[6px] -translate-y-1/2 rounded ${band}`} style={{ left: at(high), right: 0 }} />
          </>
        ) : (
          <span className={`absolute top-1/2 h-[6px] -translate-y-1/2 rounded ${band}`} style={{ left: at(low), width: `${((high - low) / (max - min)) * 100}%` }} />
        )}
        {[
          { value: low, open: lowOpen },
          { value: high, open: highOpen },
        ].map((end) => (
          <span
            key={end.value}
            className={`absolute top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] ${end.open ? "border-[#08A4AD] bg-white dark:bg-[#15181E]" : "border-[#08A4AD] bg-[#08A4AD]"}`}
            style={{ left: at(end.value) }}
          />
        ))}
      </div>
      <div className="relative h-[18px] w-full">
        {labelled.map((value) => (
          <span key={value} className="absolute -translate-x-1/2 text-[12px] leading-4 font-bold text-[#6B7480] dark:text-white/70" style={{ left: at(value) }}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
