"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lightbulb, Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { aboveButtons, LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { datatypesHref } from "@/lib/routes";
import { STEP, DATATYPES_STEPS, datatypesPrevious } from "./datatypes";
import { TYPES } from "./interactions";
import { parseTitle } from "./screen";
import { CARD, LAVENDER, Pic } from "./visuals";
import { WINDOW_ROW, WindowCard } from "./WindowCard";

/** The headline (the PDF's, cut to one line), set at a size that keeps it on one. */
const TITLE = { ...parseTitle("You unlocked *Data Types!*"), twoLines: false, size: 26 };

/** Where the scrolling part starts (stage px): under the one-line title. Its first block keeps 18px of air, so it begins where the design has it (168). */
const SCROLL_TOP = 150;
/** Fades the scrolling part into the page at its top and bottom, so it is plain that there is more. */
const FADE = "linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 20px), transparent 100%)";

const RECAP = [
  "Programs work with different kinds of information.",
  "Integer represents whole-number values.",
  "Float represents decimal-number values.",
  "String represents text.",
  "Boolean represents True or False.",
  "The meaning of information helps determine its appropriate data type.",
  "Data types help programs interpret and use information correctly.",
];

const FINAL_THOUGHT = "Before a program can work with information correctly, it needs to understand what kind of information it is.";

/**
 * "You Have Unlocked Data Types!": the four types connect to one application
 * screen, with what the learner discovered and a closing thought. Everything
 * under the title scrolls. "Complete Chapter" opens the gem popup, then
 * "Lesson complete!".
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

      {/* Everything under the title scrolls, between the title and the button: the list and the closing thought are taller than the room. */}
      <div
        className="scrollbar-none pointer-events-auto absolute inset-x-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        style={{ top: SCROLL_TOP, bottom: aboveButtons(8), maskImage: FADE, WebkitMaskImage: FADE }}
      >
        <div className="mx-auto flex w-[340px] flex-col items-center gap-3.5 pt-[18px] pb-6">
          <div className="flex flex-col items-center">
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

          <div className="flex w-full flex-col gap-2.5">
            <WindowCard title="What you learned" icon={<Lightbulb />} panel="pt-3.5 pr-[21px] pb-4 pl-[21px]">
              <ol className="flex flex-col gap-[7px]">
                {RECAP.map((point, index) => (
                  <li key={point} className={`flex items-start gap-2 px-3 py-2 text-[13px] leading-[18px] font-medium text-[#151E48] dark:text-white ${WINDOW_ROW}`}>
                    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] text-[10px] leading-none font-bold text-white">{index + 1}</span>
                    {point}
                  </li>
                ))}
              </ol>
            </WindowCard>
            <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-4 py-3 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
              <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
              {FINAL_THOUGHT}
            </p>
          </div>
        </div>
      </div>
    </LevelTwoShell>
  );
}
