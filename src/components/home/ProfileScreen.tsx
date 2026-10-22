"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Flag, Flame, Gem, RotateCcw, Sparkles, TrendingUp } from "lucide-react";
import {
  CAREER_OPTIONS,
  EXPERIENCE_OPTIONS,
  LEARNING_TIME_OPTIONS,
  MOTIVATION_OPTIONS,
  PYTHON_LEVEL_OPTIONS,
  type OnboardingAnswers,
} from "@/lib/constants/onboarding";
import { HEADING } from "./homeFonts";
import { LEARNER_STATS } from "./learnerStats";

const EASE = [0.22, 1, 0.36, 1] as const;

const labelOf = (options: { id: string; label: string }[], id: string | undefined) =>
  options.find((option) => option.id === id)?.label;

type PlanRow = { icon: ReactNode; label: string; value: string };

const ICON = "h-4 w-4";

const planRows = (answers: OnboardingAnswers): PlanRow[] => [
  { icon: <Flag className={ICON} />, label: "Career goal", value: labelOf(CAREER_OPTIONS, answers.career) ?? "Not set" },
  { icon: <TrendingUp className={ICON} />, label: "Python level", value: labelOf(PYTHON_LEVEL_OPTIONS, answers.pythonLevel) ?? "Not set" },
  { icon: <Sparkles className={ICON} />, label: "Experience", value: labelOf(EXPERIENCE_OPTIONS, answers.experience) ?? "Not set" },
  { icon: <Flag className={ICON} />, label: "Why you're learning", value: labelOf(MOTIVATION_OPTIONS, answers.motivation) ?? "Not set" },
  { icon: <Clock className={ICON} />, label: "Daily time", value: answers.timeCommitment ? `${answers.timeCommitment} min a day` : "Not set" },
  { icon: <Clock className={ICON} />, label: "Best time", value: labelOf(LEARNING_TIME_OPTIONS, answers.learningTime) ?? "Not set" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

const CARD = "rounded-[18px] border-[1.5px] border-black/10 bg-white dark:border-white/12 dark:bg-[#1A1C22]";

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-[#F7F8FA] px-1 py-3 dark:bg-[#16262D]">
      {icon}
      <span className="mt-0.5 text-base font-semibold leading-[1.3] text-[#2C2C2C] dark:text-white">{value}</span>
      <span className="text-[11px] font-medium leading-4 text-[#818185] dark:text-[#9FA19F]">{label}</span>
    </div>
  );
}

/**
 * A temporary profile page (no design yet), laid out to fit one screen with no
 * scrolling: who the learner is, their streak, gems and progress, the plan they
 * picked in onboarding, and a way to run onboarding again. It follows the
 * app's light / dark theme. Opened from the home's avatar; Back returns home.
 */
export function ProfileScreen({
  answers,
  onBack,
  onRestartOnboarding,
}: {
  answers: OnboardingAnswers;
  onBack: () => void;
  onRestartOnboarding: () => void;
}) {
  const name = answers.name?.trim() || "Learner";
  const career = labelOf(CAREER_OPTIONS, answers.career);

  return (
    <main className="h-dvh w-full overflow-hidden bg-white font-[family-name:var(--font-app-poppins)] text-[#444444] dark:bg-[#0F1F26] dark:text-white">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col gap-[clamp(12px,2.6vh,24px)] px-4 pb-[38px] pt-[54px]">
        <motion.div {...rise(0)} className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to home"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border-[1.5px] border-b-[3px] border-[#DFE3E8] bg-white transition-transform active:scale-95 dark:border-[#0B0D11] dark:bg-[#22262E]"
          >
            <ChevronLeft className="h-[22px] w-[22px] text-[#444444] dark:text-white" strokeWidth={1.65} />
          </button>
          <h1 className={`text-[22px] leading-8 text-[#2C2C2C] dark:text-white ${HEADING}`}>Profile</h1>
        </motion.div>

        <motion.section {...rise(0.06)} className={`${CARD} flex shrink-0 flex-col items-center px-5 py-6`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home/avatar.png"
            alt=""
            draggable={false}
            className="h-[84px] w-[84px] select-none rounded-full bg-[#F9F8F6] object-cover ring-4 ring-white dark:bg-[#16262D] dark:ring-[#1A1C22]"
          />
          <h2 className="mt-3 text-[20px] font-semibold leading-tight text-[#2C2C2C] dark:text-white">{name}</h2>
          <p className="text-sm text-[#818185] dark:text-[#9FA19F]">{career ? `Aspiring ${career}` : "Python learner"}</p>
          <div className="mt-5 grid w-full grid-cols-3 gap-3">
            <Stat icon={<Flame className="h-5 w-5 text-[#FF8D42]" />} value={String(LEARNER_STATS.streak)} label="Day streak" />
            <Stat icon={<Gem className="h-5 w-5 text-[#3683D3] dark:text-[#5AA2FF]" />} value={String(LEARNER_STATS.gems)} label="Gems" />
            <Stat icon={<TrendingUp className="h-5 w-5 text-[#5D4CFE] dark:text-[#8E82FF]" />} value="2/7" label="Module 1" />
          </div>
        </motion.section>

        <motion.section {...rise(0.12)} className={`${CARD} min-h-0 shrink p-5`}>
          <h3 className="text-sm font-semibold text-[#2C2C2C] dark:text-white">Your learning plan</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            {planRows(answers).map((row) => (
              <li key={row.label} className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFEAFC] text-[#5D4CFE] dark:bg-[#2A2550] dark:text-[#8E82FF]">
                  {row.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] leading-4 text-[#818185] dark:text-[#9FA19F]">{row.label}</span>
                  <span className="block truncate text-[13px] font-medium leading-4 text-[#2C2C2C] dark:text-white">{row.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.div {...rise(0.18)} className="shrink-0 pt-2">
          <button
            type="button"
            onClick={onRestartOnboarding}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[44px] bg-[#5D4CFE] text-sm font-semibold text-white shadow-[0_4px_0_#4536D6] transition-transform duration-150 active:translate-y-[3px] active:shadow-[0_1px_0_#4536D6]"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
            Redo onboarding
          </button>
        </motion.div>
      </div>
    </main>
  );
}
