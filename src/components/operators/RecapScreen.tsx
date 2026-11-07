"use client";

import { useCallback, useState, type ReactNode } from "react";
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

/** Where the lines of the branch meet the boxes (% of the card's width): the "True or False" box, and the middle of each path below it. */
const BRANCH = { from: 85, true: 24, false: 76 } as const;

/** One box of the flow. */
function FlowBox({ children, delay, tone }: { children: ReactNode; delay: number; tone: "plain" | "key" | "good" | "warn" }) {
  const look = {
    plain: `${LAVENDER} text-[#444444] dark:text-white`,
    key: "bg-[#08A4AD] text-white shadow-[0_3px_0_#067F86]",
    good: "bg-[#E3F6F3] text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FE0D6]",
    warn: "bg-[#FFF4E3] text-[#A85B00] dark:bg-[#4A3418] dark:text-[#FFB267]",
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-2 py-1 text-center text-[13px] leading-4 font-bold ${look}`}
    >
      {children}
    </motion.div>
  );
}

/** An arrow between two boxes of the flow. */
function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.svg
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-[#08A4AD]"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </motion.svg>
  );
}

/** The two paths out of "True or False", drawn as a line that splits. */
function Branches({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-5 w-full text-[#08A4AD]" aria-hidden>
      <motion.path
        d={`M${BRANCH.from} 0V10M${BRANCH.true} 10H${BRANCH.from}M${BRANCH.true} 10V20M${BRANCH.false} 10V20`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

/** A small round mark: a tick or a warning. */
function Mark({ good }: { good: boolean }) {
  return (
    <span aria-hidden className={`flex size-4 items-center justify-center rounded-full text-[10px] leading-none font-bold text-white ${good ? "bg-[#01A17F]" : "bg-[#E8743B]"}`}>
      {good ? "✓" : "!"}
    </span>
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
        <div className={`flex flex-col px-2.5 py-2.5 ${CARD} ${LAVENDER}`}>
          <div className="flex items-center gap-1.5">
            <FlowBox tone="plain" delay={0.2}>
              Shopping total
            </FlowBox>
            <FlowArrow delay={0.4} />
            <FlowBox tone="key" delay={0.5}>
              Compare with budget
            </FlowBox>
            <FlowArrow delay={0.7} />
            <FlowBox tone="plain" delay={0.8}>
              True or False
            </FlowBox>
          </div>
          <Branches delay={1.05} />
          <div className="flex items-stretch gap-2">
            <FlowBox tone="good" delay={1.5}>
              <span className="flex items-center gap-1">
                <Mark good />
                True
              </span>
              <span className="font-semibold">Within budget → Continue purchase</span>
            </FlowBox>
            <FlowBox tone="warn" delay={1.65}>
              <span className="flex items-center gap-1">
                <Mark good={false} />
                False
              </span>
              <span className="font-semibold">Over budget → Show a warning</span>
            </FlowBox>
          </div>
        </div>

        <p className="px-1 pt-1 text-[12px] leading-4 font-bold tracking-[0.4px] text-[#6B7480] uppercase dark:text-white/60">A program can now</p>
        <ul className="flex flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-3.5 py-2.5 dark:bg-[#0F2B28]">
          {CAN_NOW.map((point, index) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.9 + index * 0.15, duration: 0.3 }}
              className="flex items-start gap-2 text-[13px] leading-[18px] font-medium text-[#2F5D59] dark:text-[#BFE6E2]"
            >
              <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] shadow-[0_1px_0_#067F86]">
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              {point}
            </motion.li>
          ))}
        </ul>

        <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-3.5 py-2.5 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
          {FINAL_THOUGHT}
        </p>
        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">
          <span aria-hidden className="rounded-full bg-[#08A4AD] px-2 py-0.5 text-[10px] leading-3 font-bold tracking-[0.4px] text-white uppercase">
            Next
          </span>
          Conditions: teaching a program to make decisions.
        </p>
      </div>
    </LevelTwoShell>
  );
}
