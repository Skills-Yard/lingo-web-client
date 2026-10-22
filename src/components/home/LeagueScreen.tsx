"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { HEADING } from "./homeFonts";

const EASE = [0.22, 1, 0.36, 1] as const;

const PROMOTE_COUNT = 5;
const DAYS_LEFT = 2;

/** `color` is the ring round the profile letter, as on the feed's stories. */
type Entry = { name: string; xp: number; color: string; you?: boolean };

const STANDINGS: readonly Entry[] = [
  { name: "Maya", xp: 980, color: "#FF8D42" },
  { name: "Dev", xp: 920, color: "#2F80ED" },
  { name: "Sara", xp: 860, color: "#5D4CFE" },
  { name: "Alex (you)", xp: 640, color: "#01A17F", you: true },
  { name: "Ravi", xp: 610, color: "#3683D3" },
  { name: "Ana", xp: 540, color: "#DC2626" },
];

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function Row({ rank, entry }: { rank: number; entry: Entry }) {
  const podium = rank <= 3;
  return (
    <div
      className={`relative flex items-center gap-3 rounded-[18px] p-3.5 ${
        entry.you
          ? "h-[68px] border-2 border-[#01A17F] bg-[#E9F5F0] dark:bg-[#0F2921]"
          : "h-[67px] border-[1.5px] border-black/10 bg-white dark:border-white/12 dark:bg-[#1A1C22]"
      }`}
    >
      <span
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center text-base font-extrabold leading-[22px] ${
          podium ? "text-[#FF8D42]" : "text-[#818185] dark:text-[#9FA19F]"
        }`}
      >
        {rank}
      </span>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white text-sm font-extrabold text-[#2C2C2C] dark:bg-[#1A1C22] dark:text-white"
        style={{ borderColor: entry.color }}
      >
        {entry.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1 truncate text-base font-extrabold leading-[22px] text-[#2C2C2C] dark:text-white">
        {entry.name}
      </span>
      <span className="shrink-0 text-sm font-semibold leading-5 text-[#444444] dark:text-[#C8C7C5]">
        {entry.xp} XP
      </span>
    </div>
  );
}

/**
 * `/league` — the weekly league: this week's standings, with the line under
 * which the top five move up. Full screen, so no nav or stats bar.
 */
export function LeagueScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="h-dvh w-full overflow-hidden bg-white font-[family-name:var(--font-app-poppins)] text-[#444444] dark:bg-[#0F1F26] dark:text-white">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-[54px]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border-[1.5px] border-b-[3px] border-[#DFE3E8] bg-white transition-transform active:scale-95 dark:border-[#0B0D11] dark:bg-[#22262E]"
          >
            <ChevronLeft className="h-[22px] w-[22px] text-[#444444] dark:text-white" strokeWidth={1.65} />
          </button>

          <motion.h1
            {...reveal(0.04)}
            className={`mt-[10px] text-[26px] leading-8 tracking-[-0.2px] text-[#2C2C2C] dark:text-white ${HEADING}`}
          >
            Weekly league
          </motion.h1>
          <motion.p {...reveal(0.08)} className="mt-[10px] text-sm font-semibold leading-5 text-[#818185] dark:text-[#9FA19F]">
            Top {PROMOTE_COUNT} move up · {DAYS_LEFT} days left
          </motion.p>

          <div className="mt-5 flex flex-col gap-3">
            {STANDINGS.map((entry, i) => (
              <motion.div key={entry.name} {...reveal(0.12 + i * 0.05)}>
                <Row rank={i + 1} entry={entry} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
