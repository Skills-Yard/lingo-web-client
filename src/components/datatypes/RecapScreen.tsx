"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { datatypesHref } from "@/lib/routes";
import { STEP, DATATYPES_STEPS, datatypesPrevious } from "./datatypes";
import { TYPES } from "./interactions";
import { parseTitle } from "./screen";
import { CARD, LAVENDER, Pic } from "./visuals";

const TITLE = parseTitle("You Have Unlocked *Data Types!*");

const RECAP = [
  "Programs work with different kinds of information.",
  "Integer represents whole-number values.",
  "Float represents decimal-number values.",
  "String represents text.",
  "Boolean represents True or False.",
  "The meaning of information helps decide its data type.",
  "Data types help programs use information correctly.",
];

const FINAL_THOUGHT = "Before a program can work with information correctly, it needs to understand what kind of information it is.";

/**
 * "You Have Unlocked Data Types!": the four types connect to one application
 * screen, with what the learner discovered and a closing thought. "Complete
 * Chapter" opens the gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(datatypesHref("complete"));
  }, [router]);

  return (
    <LevelTwoShell
      step={STEP.recap}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(STEP.recap))}
      scene={<SoftBackdrop />}
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.7 }}
          className="flex h-[40px] w-[150px] items-center justify-center rounded-[10px] bg-[#08A4AD] text-[14px] leading-5 font-bold text-white shadow-[0_3px_0_#067F86]"
        >
          Your application
        </motion.div>
        <svg aria-hidden width={340} height={26} viewBox="0 0 340 26" fill="none">
          {TYPES.map((_, index) => {
            const x = 43 + index * 85;
            return (
              <motion.path
                key={index}
                d={`M170 0 C170 13 ${x} 11 ${x} 26`}
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
          {TYPES.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.12 }}
              className={`flex w-[76px] flex-col items-center gap-0.5 px-1 py-2 ${CARD} ${LAVENDER}`}
            >
              <Pic src={type.icon} className="h-9 w-9" />
              <span className="text-[13px] leading-5 font-bold text-[#444444] dark:text-white">{type.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 flex w-[340px] -translate-x-1/2 flex-col gap-2.5" style={{ top: 330 }}>
        <ol className="flex flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-4 py-3 dark:bg-[#0F2B28]">
          {RECAP.map((point, index) => (
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
