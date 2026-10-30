"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppWindow, BrainCircuit, ChartNoAxesColumn, CodeXml, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { CAREERS, FILTERS, type Career, type Filter } from "./careersData";
import { HomeStage, STAGE_GUTTER } from "./HomeStage";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Height of the content, in stage px; the stage and nav are HomeStage's. */
const STAGE_H = 660;

const FILTER_ICONS: Record<Filter, LucideIcon> = {
  All: CodeXml,
  Data: ChartNoAxesColumn,
  AI: BrainCircuit,
  Web: AppWindow,
  Security: ShieldCheck,
};

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

function CareerCard({
  career,
  selected,
  onSelect,
}: {
  career: Career;
  selected: boolean;
  onSelect: () => void;
}) {
  const { card } = career;
  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: EASE }}
      aria-pressed={selected}
      style={{ backgroundColor: card.bg, borderColor: card.border }}
      className="relative flex h-[146px] flex-col items-start gap-1 overflow-hidden rounded-2xl border py-4 pl-3 pr-2 text-left shadow-[1px_1px_11px_rgba(0,0,0,0.08)] dark:brightness-90"
    >
      <span className="text-base font-bold leading-6 text-[#444444]">{career.title}</span>
      <span className="whitespace-nowrap text-sm leading-[18px] text-[#444444]">
        {career.skills.length} skills · {career.months} months
      </span>
      <span className="whitespace-nowrap text-sm font-semibold leading-[18px]" style={{ color: card.accent }}>
        {career.salary} / yr
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.image}
        alt=""
        draggable={false}
        className="pointer-events-none absolute bottom-0 right-0 max-w-none select-none object-contain"
        style={card.box}
      />
    </motion.button>
  );
}

/**
 * The careers tab: the learner's stats, a search box, category filters and the
 * careers to pick from, above the same bottom nav the home has.
 */
export function CareersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(CAREERS[0].id);

  const needle = query.trim().toLowerCase();
  const visible = CAREERS.filter(
    (c) =>
      (filter === "All" || c.category === filter) &&
      (!needle || c.title.toLowerCase().includes(needle) || c.category.toLowerCase().includes(needle)),
  );

  return (
    <HomeStage stageHeight={STAGE_H} className="bg-[#F3F4F7] dark:bg-[#0F1F26]">
      <div className={`flex h-full flex-col ${STAGE_GUTTER}`}>
        <motion.label
          {...reveal(0.1)}
          className="flex h-[51px] shrink-0 items-center gap-2.5 rounded-lg border-[1.5px] border-black/10 bg-white p-3 text-[#818185] focus-within:border-[#01A17F] dark:border-white/12 dark:bg-[#1A1C22] dark:text-[#9FA19F]"
        >
          <Search className="h-5 w-5 shrink-0" strokeWidth={1.6} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search careers, skills..."
            className="min-w-0 flex-1 bg-transparent text-base text-[#2B2B2F] outline-none placeholder:text-[#818185] dark:text-white dark:placeholder:text-[#9FA19F]"
          />
        </motion.label>

        <motion.div
          {...reveal(0.14)}
          className="scrollbar-none -mx-[var(--stage-gutter)] mt-5 flex shrink-0 gap-3 overflow-x-auto px-[var(--stage-gutter)]"
          role="tablist"
        >
          {FILTERS.map((name) => {
            const selected = name === filter;
            const Icon = FILTER_ICONS[name];
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(name)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-[28px] border px-3.5 text-sm font-medium transition-colors duration-300 ${
                  selected
                    ? "border-transparent bg-[#444444] text-white dark:bg-white dark:text-[#1A1C22]"
                    : "border-black/10 bg-[#F7F8FA] text-[#444444] dark:border-white/12 dark:bg-[#16262D] dark:text-[#C8C7C5]"
                }`}
              >
                {selected ? (
                  <span className="flex h-[31px] w-[31px] items-center justify-center rounded-[9px] bg-white text-[#444444] dark:bg-[#1A1C22] dark:text-white">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                ) : (
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                )}
                {name}
              </button>
            );
          })}
        </motion.div>

        <div className="mt-5 grid grid-cols-2 content-start gap-4">
          <AnimatePresence mode="popLayout" initial>
            {visible.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                selected={career.id === selectedId}
                onSelect={() => {
                  setSelectedId(career.id);
                  router.push(`/careers/${career.id}`);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </HomeStage>
  );
}
