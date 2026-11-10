"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { TrekBackdrop } from "./scenes";
import { variableHref } from "@/lib/routes";
import { parseTitle } from "./quiz";
import { STEP, variablePrevious, VARIABLE_STEPS } from "./variable";
import { CARD } from "./visuals";

const TITLE = parseTitle("You *Unlocked Variables!*");

/** The things the chapter used, each a step toward the idea. */
const OBJECTS = [
  { emoji: "🍶", label: "Water bottle" },
  { emoji: "📋", label: "Attendance board" },
  { emoji: "🛍️", label: "Shopping items" },
  { emoji: "👛", label: "Wallet" },
  { emoji: "🧮", label: "Addition app" },
] as const;

const TAKEAWAYS = [
  "Programs keep track of information.",
  "Variables give information names.",
  "A variable has a name and a value.",
  "Values can change.",
  "Different variables track different things.",
  "Variables help programs calculate.",
];

const FINAL_THOUGHT = "Variables help programs remember information and use it later.";

/**
 * "You Unlocked Variables!": the chapter's things connect to one central
 * idea, its takeaways and its closing thought. "Complete Chapter" opens the
 * gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(variableHref("complete"));
  }, [router]);

  return (
    <LevelTwoShell
      step={STEP.recap}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.recap))}
      scene={<TrekBackdrop />}
      ctaLabel="Complete Chapter"
      onContinue={() => setGemOpen(true)}
      overlay={<GemPopup open={gemOpen} onClose={closeGem} />}
    >
      <ScreenTitle oneLine={!TITLE.twoLines}>
        <span style={{ fontSize: TITLE.size }}>
          {TITLE.parts.map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="text-level-gradient">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      </ScreenTitle>

      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 168 }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.8 }}
          className="rounded-full bg-[#08A4AD] px-4 py-1.5 text-[15px] leading-5 font-bold text-white shadow-[0_3px_0_#067F86]"
        >
          variable
        </motion.span>
        <svg aria-hidden width={340} height={28} viewBox="0 0 340 28" fill="none">
          {OBJECTS.map((_, index) => {
            const x = 34 + index * 68;
            return (
              <motion.path
                key={index}
                d={`M170 0 C170 14 ${x} 12 ${x} 28`}
                stroke="#04ACAB"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="4 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + index * 0.12, duration: 0.6 }}
              />
            );
          })}
        </svg>
        <div className="flex w-[340px] justify-between">
          {OBJECTS.map((object, index) => (
            <motion.div
              key={object.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.12 }}
              className="flex w-[64px] flex-col items-center gap-1"
            >
              <span aria-hidden className={`flex size-[48px] items-center justify-center text-[26px] leading-none ${CARD}`}>
                {object.emoji}
              </span>
              <span className="text-center text-[10px] leading-3 font-semibold text-[#6B7480] dark:text-white/60">{object.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 flex w-[340px] -translate-x-1/2 flex-col gap-2.5" style={{ top: 318 }}>
        <ol className="flex flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-4 py-3 dark:bg-[#0F2B28]">
          {TAKEAWAYS.map((point, index) => (
            <li key={point} className="flex items-start gap-2 text-[13px] leading-[18px] font-medium text-[#2F5D59] dark:text-[#BFE6E2]">
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] text-[10px] leading-none font-bold text-white">{index + 1}</span>
              {point}
            </li>
          ))}
        </ol>
        <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-4 py-3 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
          {FINAL_THOUGHT}
        </p>
      </div>
    </LevelTwoShell>
  );
}
