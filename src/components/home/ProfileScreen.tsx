"use client";

import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import { Clock, Flag, Gem, Flame, RotateCcw, Sparkles, TrendingUp, UserRound } from "lucide-react";
import {
  CAREER_OPTIONS,
  EXPERIENCE_OPTIONS,
  LEARNING_TIME_OPTIONS,
  MOTIVATION_OPTIONS,
  PYTHON_LEVEL_OPTIONS,
  type OnboardingAnswers,
} from "@/lib/constants/onboarding";
import { BottomNav, type HomeTab } from "./BottomNav";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

const EASE = [0.22, 1, 0.36, 1] as const;

const labelOf = (options: { id: string; label: string }[], id: string | undefined) =>
  options.find((option) => option.id === id)?.label;

type PlanRow = { icon: ReactNode; label: string; value: string };

const planRows = (answers: OnboardingAnswers): PlanRow[] => {
  const rows: (PlanRow | null)[] = [
    {
      icon: <Flag className="h-[18px] w-[18px]" />,
      label: "Career goal",
      value: labelOf(CAREER_OPTIONS, answers.career) ?? "Not set",
    },
    {
      icon: <TrendingUp className="h-[18px] w-[18px]" />,
      label: "Python level",
      value: labelOf(PYTHON_LEVEL_OPTIONS, answers.pythonLevel) ?? "Not set",
    },
    {
      icon: <Sparkles className="h-[18px] w-[18px]" />,
      label: "Coding experience",
      value: labelOf(EXPERIENCE_OPTIONS, answers.experience) ?? "Not set",
    },
    {
      icon: <Flag className="h-[18px] w-[18px]" />,
      label: "Why you're learning",
      value: labelOf(MOTIVATION_OPTIONS, answers.motivation) ?? "Not set",
    },
    {
      icon: <Clock className="h-[18px] w-[18px]" />,
      label: "Daily time",
      value: answers.timeCommitment ? `${answers.timeCommitment} min a day` : "Not set",
    },
    {
      icon: <Clock className="h-[18px] w-[18px]" />,
      label: "Best time to learn",
      value: labelOf(LEARNING_TIME_OPTIONS, answers.learningTime) ?? "Not set",
    },
  ];
  return rows.filter((row): row is PlanRow => row !== null);
};

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

/** The same raised-card look the onboarding options and the module card use:
 * light surface, soft shadow, khaki bottom edge. */
const CARD =
  "rounded-lg border-b-[6px] border-[#BDBA99] bg-[#F7F8FA] shadow-[1px_1px_9.4px_rgba(0,0,0,0.16)]";

/**
 * The learner's profile: who they are, their streak and gems, the plan they
 * picked in onboarding, and a way to run onboarding again.
 */
export function ProfileScreen({
  answers,
  onNavigate,
  onRestartOnboarding,
}: {
  answers: OnboardingAnswers;
  onNavigate: (tab: HomeTab) => void;
  onRestartOnboarding: () => void;
}) {
  const name = answers.name?.trim() || "Learner";
  const initial = name.charAt(0).toUpperCase();
  const career = labelOf(CAREER_OPTIONS, answers.career);

  return (
    <main
      className={`${poppins.className} onboarding-light relative flex h-dvh w-full justify-center overflow-hidden bg-gradient-to-b from-white from-[0.15%] via-[#FCFFFC] via-[47%] to-[#F4FFF6] text-[#1A1C22]`}
    >
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-4">
          <motion.h1 className="text-xl font-semibold" {...rise(0)}>
            Profile
          </motion.h1>

          {/* Identity */}
          <motion.section
            className={`${CARD} mt-4 flex flex-col items-center bg-gradient-to-b from-white from-[30.82%] to-[#DCD5FE] px-5 pb-5 pt-6`}
            {...rise(0.06)}
          >
            <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-[#887FFE] via-[#5A48FF] to-[#5D46EE] text-[34px] font-semibold text-white shadow-[0_6px_14px_rgba(90,72,255,0.35)] ring-4 ring-white">
              {name === "Learner" ? <UserRound className="h-10 w-10" /> : initial}
            </span>
            <h2 className="mt-3 text-[22px] font-semibold leading-tight">{name}</h2>
            <p className="mt-0.5 text-sm font-medium text-[#666666]">
              {career ? `Aspiring ${career}` : "Python learner"}
            </p>

            <div className="mt-5 grid w-full grid-cols-3 gap-2">
              <Stat icon={<Flame className="h-5 w-5 text-[#FF8D42]" />} value="4" label="Day streak" />
              <Stat icon={<Gem className="h-5 w-5 text-[#3683D3]" />} value="373" label="Gems" />
              <Stat icon={<TrendingUp className="h-5 w-5 text-[#5D4CFE]" />} value="2/7" label="Module 1" />
            </div>
          </motion.section>

          {/* Plan */}
          <motion.section className={`${CARD} mt-4 p-4`} {...rise(0.12)}>
            <h3 className="text-base font-semibold">Your learning plan</h3>
            <ul className="mt-2 divide-y divide-black/6">
              {planRows(answers).map((row) => (
                <li key={row.label} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
                    {row.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium leading-[18px] text-[#666666]">
                      {row.label}
                    </span>
                    <span className="block truncate text-sm font-medium leading-[1.4]">{row.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Redo onboarding */}
          <motion.section className={`${CARD} mt-4 p-4`} {...rise(0.18)}>
            <h3 className="text-base font-semibold">Start over</h3>
            <p className="mt-1 text-sm leading-[1.4] text-[#666666]">
              Want a different goal or pace? Go through the quick questions again to
              rebuild your path.
            </p>
            <button
              type="button"
              onClick={onRestartOnboarding}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[44px] bg-[#5D4CFE] text-sm font-semibold text-white shadow-[0_4px_0_#4536D6] transition-transform duration-150 active:translate-y-[3px] active:shadow-[0_1px_0_#4536D6]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
              Redo onboarding
            </button>
          </motion.section>
        </div>

        {/* Pinned nav, over a fade so content slides beneath it. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[128px] items-end justify-center bg-gradient-to-t from-[#F4FFF6] from-[35%] to-transparent px-4 pb-9">
          <BottomNav active="profile" onNavigate={onNavigate} />
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-black/8 bg-white/70 px-1 py-2.5">
      {icon}
      <span className="mt-1 text-base font-semibold leading-[1.3]">{value}</span>
      <span className="text-[11px] font-medium leading-4 text-[#666666]">{label}</span>
    </div>
  );
}
