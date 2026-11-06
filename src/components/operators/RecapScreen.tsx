"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { operatorsHref } from "@/lib/routes";
import { OPERATORS_STEPS, STEP, operatorsPrevious } from "./operators";
import { parseTitle } from "./screen";
import { CARD, LAVENDER } from "./visuals";

const TITLE = parseTitle("From Calculation *to Decision*");

const CAN_NOW = [
  "Calculate a shopping bill.",
  "Find how much money remains.",
  "Divide objects into complete groups and find the remainder.",
  "Compare a score with a target.",
  "Check whether a purchase is within budget.",
];

const FINAL_THOUGHT = "Operators help a program calculate and compare values. The result of a comparison can help a program make a decision.";

/** One box of the flow. */
function FlowBox({ children, delay, tone }: { children: string; delay: number; tone: "plain" | "key" | "good" | "warn" }) {
  const look = {
    plain: `${LAVENDER} text-[#444444] dark:text-white`,
    key: "bg-[#08A4AD] text-white shadow-[0_3px_0_#067F86]",
    good: "bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28]",
    warn: "bg-[#FFF4E3] text-[#A85B00] dark:bg-[#4A3418]",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] px-2 py-1 text-center text-[13px] leading-4 font-bold ${look}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * "From Calculation to Decision": the application's flow (shopping total,
 * compare with the budget, True or False, two paths), what the program can do
 * now, and the closing thought that leads to Conditions. "Complete Chapter"
 * opens the gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(operatorsHref("complete"));
  }, [router]);

  return (
    <LevelTwoShell
      step={STEP.decision}
      total={OPERATORS_STEPS}
      onBack={() => router.push(operatorsPrevious(STEP.decision))}
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

      <div className="absolute left-1/2 flex w-[340px] -translate-x-1/2 flex-col gap-2" style={{ top: 168 }}>
        <div className={`flex flex-col gap-2 px-2.5 py-2.5 ${CARD} ${LAVENDER}`}>
          <div className="flex items-center gap-1.5">
            <FlowBox tone="plain" delay={0.2}>
              Shopping total
            </FlowBox>
            <span className="text-[#08A4AD]">→</span>
            <FlowBox tone="key" delay={0.5}>
              Compare with budget
            </FlowBox>
            <span className="text-[#08A4AD]">→</span>
            <FlowBox tone="plain" delay={0.8}>
              True or False
            </FlowBox>
          </div>
          <div className="flex items-center gap-1.5">
            <FlowBox tone="good" delay={1.1}>
              True: within budget → Continue purchase
            </FlowBox>
            <FlowBox tone="warn" delay={1.3}>
              False: over budget → Show a warning
            </FlowBox>
          </div>
        </div>

        <p className="px-1 pt-1 text-[12px] leading-4 font-bold tracking-[0.4px] text-[#6B7480] uppercase dark:text-white/60">A program can now</p>
        <ol className="flex flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-3.5 py-2.5 dark:bg-[#0F2B28]">
          {CAN_NOW.map((point, index) => (
            <li key={point} className="flex items-start gap-2 text-[13px] leading-[18px] font-medium text-[#2F5D59] dark:text-[#BFE6E2]">
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] text-[10px] leading-none font-bold text-white">{index + 1}</span>
              {point}
            </li>
          ))}
        </ol>

        <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-3.5 py-2.5 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
          {FINAL_THOUGHT}
        </p>
        <p className="text-center text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">Next chapter: Conditions, teaching a program to make decisions.</p>
      </div>
    </LevelTwoShell>
  );
}
