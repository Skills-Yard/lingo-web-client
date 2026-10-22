"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { CAREERS, FILTERS, GREEN, type Career, type Filter } from "./careersData";
import { HomeStage, TOP_BAR_BOTTOM } from "./HomeStage";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Height of the content, in stage px; the stage and nav are HomeStage's. */
const STAGE_H = 540;

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
  const { Icon } = career;
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
      className={`flex flex-col items-start rounded-xl border bg-white p-3 text-left transition-colors duration-300 dark:bg-[#1A1C22] ${
        selected ? "border-[#01A17F] border-[1.5px]" : "border-black/8 dark:border-white/12"
      }`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg dark:bg-[#16262D]!"
        style={{ backgroundColor: career.tint, color: career.color }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <span className="mt-2 truncate text-[13px] font-semibold text-[#2B2B2F] dark:text-white">{career.title}</span>
      <span className="mt-0.5 text-[11px] font-medium" style={{ color: GREEN }}>
        {career.salary} / yr
      </span>
      <span className="mt-1 text-[10px] text-[#7B7B80] dark:text-[#9FA19F]">
        {career.skills.length} skills · {career.months} months
      </span>
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
    <HomeStage stageHeight={STAGE_H} topMargin={TOP_BAR_BOTTOM} className="bg-[#F3F4F7] dark:bg-[#0F1F26]">
      <div className="flex h-full flex-col px-4">
        <motion.h1 {...reveal(0.06)} className="text-[22px] font-semibold leading-tight text-[#2B2B2F] dark:text-white">
          Careers
        </motion.h1>

        <motion.label
          {...reveal(0.1)}
          className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-black/8 bg-white px-3 text-[#7B7B80] focus-within:border-[#01A17F] dark:border-white/12 dark:bg-[#1A1C22] dark:text-[#9FA19F]"
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search careers, skills..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#2B2B2F] outline-none placeholder:text-[#7B7B80] dark:text-white dark:placeholder:text-[#9FA19F]"
          />
        </motion.label>

        <motion.div {...reveal(0.14)} className="mt-3 flex gap-2" role="tablist">
          {FILTERS.map((name) => {
            const selected = name === filter;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(name)}
                className={`relative h-8 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-300 ${
                  selected ? "border-transparent text-white" : "border-black/8 bg-white text-[#444444] dark:border-transparent dark:bg-[#16262D] dark:text-[#C8C7C5]"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="career-filter-pill"
                    className="absolute -inset-px rounded-full"
                    style={{ backgroundColor: GREEN }}
                    transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                  />
                )}
                <span className="relative">{name}</span>
              </button>
            );
          })}
        </motion.div>

        <div className="mt-3 grid grid-cols-2 content-start gap-2.5">
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
