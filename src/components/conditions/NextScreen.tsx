"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Route } from "lucide-react";
import { LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { CARD, LAVENDER } from "@/components/operators/visuals";
import { conditionsHref } from "@/lib/routes";
import { CONDITIONS_STEPS, STEP, conditionsPrevious } from "./conditions";
import { parseTitle } from "./screen";

const TITLE = parseTitle("What *Comes Next?*");

/** Three conditions and what they came to: the questions a program can already ask. */
const CARDS = [
  { condition: "marks >= 40", question: "Has the student passed?", result: true },
  { condition: "age >= 18", question: "Is the person eligible?", result: false },
  { condition: "password == saved", question: "Is the password correct?", result: true },
] as const;

const CAN = ["Construct simple conditions.", "Check mathematical requirements.", "Combine multiple conditions.", "Test and debug conditions."];

/**
 * "What comes next?": the three questions a program can ask (each with its
 * True or False), what the learner can now do, and a new path, "Selection /
 * Decision Making", that the next chapter opens (no if or else yet). Continue
 * ends the lesson.
 */
export function NextScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={STEP.next}
      total={CONDITIONS_STEPS}
      onBack={() => router.push(conditionsPrevious(STEP.next))}
      scene={<SoftBackdrop />}
      ctaLabel="Continue"
      onContinue={() => router.push(conditionsHref("complete"))}
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

      <div className="absolute left-1/2 flex w-[340px] -translate-x-1/2 flex-col gap-2.5" style={{ top: 130 }}>
        <p className="text-center text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">You know how to ask a program a question.</p>
        <div className="flex flex-col gap-1.5">
          {CARDS.map((card, index) => (
            <motion.div
              key={card.condition}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.35 }}
              className={`flex items-center gap-2 px-3 py-2 ${CARD} ${LAVENDER}`}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-[15px] leading-5 font-bold text-[#08A4AD]">{card.condition}</span>
                <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{card.question}</span>
              </div>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.35 }}
                className={`rounded-full px-3 py-0.5 text-[14px] leading-6 font-bold text-white ${card.result ? "bg-[#01A17F]" : "bg-[#D42421]"}`}
              >
                {card.result ? "True" : "False"}
              </motion.span>
            </motion.div>
          ))}
        </div>

        <ul className="flex flex-col gap-1 rounded-[14px] bg-[#E3F6F3] px-3.5 py-2.5 dark:bg-[#0F2B28]">
          {CAN.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] leading-[18px] font-medium text-[#2F5D59] dark:text-[#BFE6E2]">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#04ACAB]" />
              {point}
            </li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.6, type: "spring", stiffness: 200, damping: 16 }}
          className="flex items-center gap-3 rounded-[14px] bg-[#08A4AD] px-4 py-3 shadow-[0_3px_0_#067F86]"
        >
          <Route aria-hidden className="size-8 shrink-0 text-white" />
          <div className="flex flex-col">
            <span className="text-[11px] leading-4 font-bold tracking-[0.4px] text-white/80 uppercase">New pathway ahead</span>
            <span className="text-[17px] leading-6 font-bold text-white">Selection / Decision Making</span>
          </div>
        </motion.div>
        <p className="text-center text-[13px] leading-[18px] font-medium text-[#6B7480] dark:text-white/70">What can a program do with these results? We will explore that in the next chapter.</p>
      </div>
    </LevelTwoShell>
  );
}
