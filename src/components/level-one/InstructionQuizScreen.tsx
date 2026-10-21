"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/components/onboarding/clickSound";
import { optionDropIn } from "@/components/onboarding/optionCard";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { Confetti } from "./Confetti";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { FeedbackPanel } from "./FeedbackPanel";
import { HexGlide } from "./HexStage";
import { LevelOneShell, levelOneHref, levelOneRewardHref } from "./LevelOneShell";
import { optionState } from "./TeacherFlow";

const CORRECT_ID = "command";
/** The `entryStyle` Hex enters with here (set before the entrance trigger). */
const HEX_ENTRY_STYLE = 6;

const OPTIONS = [
  { id: "statement", icon: "/images/level-one/statement.png", title: "Statement", tint: "bg-[#F6F4FE]", iconSize: "h-9 w-[31px]" },
  { id: "command", icon: "/images/level-one/command.png", title: "Command", tint: "bg-[#FFF4F6]", iconSize: "h-8 w-[26px]" },
  { id: "question", icon: "/images/level-one/question.png", title: "Question", tint: "bg-[#FFF9F0]", iconSize: "h-[31px] w-[38px]" },
] as const;

/** The card's 4px bottom edge and fill: tinted at rest, coloured once picked / marked. */
const LOOK = {
  idle: "border-[#BDBA99]",
  selected: "border-[#008566] bg-[#F2FBF8]! dark:bg-[#0F2921]!",
  correct: "border-[#008566] bg-[#F2FBF8]! dark:bg-[#0F2921]!",
  wrong: "border-[#B3261E] bg-[#FFF1F1]! dark:bg-[#2A1517]!",
} as const;

/**
 * `/module?level=1&step=7` — "What are instructions known as?": a single-answer quiz
 * with Hex between the question and the options. Check locks the answer and
 * marks it right (green) or wrong (red); Continue follows.
 */
export function InstructionQuizScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  // Hex sits in the question's slot and leaves as soon as an option is picked;
  // on Check the result panel brings its own Hex, entering inside it.
  const glideRef = useRef<HTMLDivElement>(null);
  const [questionSlot, setQuestionSlot] = useState<HTMLDivElement | null>(null);

  return (
    <LevelOneShell
      step={7}
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : "Check"}
      onBack={() => router.push(levelOneHref(6))}
      onContinue={() => {
        if (!checked) {
          setChecked(true);
          setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: selectedId === CORRECT_ID }));
        } else (onContinue ?? (() => router.push(levelOneHref(7))))();
      }}
      overlay={
        <div ref={glideRef} className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            key="feedback"
            correct={selectedId === CORRECT_ID}
            open={checked}
            hexIn={checked}
            hexCue={selectedId === CORRECT_ID ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
          >
            {selectedId === CORRECT_ID ? "Yes! " : "Remember: "}Instructions in a program{" "}
            {selectedId === CORRECT_ID ? "is" : "are"} called <b>commands.</b>
          </FeedbackPanel>
          <HexGlide entryStyle={HEX_ENTRY_STYLE} fromEl={questionSlot} leaving={selectedId !== null}
            containerRef={glideRef} />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.3, delay: 0.3 },
          y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 },
        }}
        className="mt-9 flex w-full shrink-0 items-center gap-3"
      >
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#04ACAB]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/level-one/q-badge.png" alt="Question" draggable={false} className="h-[26px] w-[30px] object-contain" />
        </span>
        <h1 className="text-[24px] leading-8 font-semibold text-[#2C2C2C] dark:text-white">
          What are <span className="text-[#00B8A9]">instructions</span> known as?
        </h1>
      </motion.div>

      {/* Hex's spot: the Hex itself is drawn by the overlay's HexGlide, which
        sends him off when an option is picked; on Check the slot closes and
        the options slide up into its space. */}
      <motion.div
        ref={setQuestionSlot}
        aria-hidden
        className="pointer-events-none w-[180px] shrink-0"
        initial={false}
        animate={checked ? { height: 0, marginTop: 0 } : { height: 150, marginTop: 8 }}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
      />

      <div className="relative mt-5 w-full shrink-0">
        <div className="relative flex flex-col gap-[23px]">
          {OPTIONS.map((option, i) => {
            const state = optionState(option.id, selectedId, checked, CORRECT_ID);
            return (
              <motion.button
                key={option.id}
                {...optionDropIn(state === "selected")}
                type="button"
                disabled={checked}
                onClick={() => {
                  playClickSound();
                  setSelectedId(option.id);
                }}
                aria-pressed={state === "selected"}
                className={`relative flex h-[89px] w-full cursor-pointer flex-row items-center justify-start gap-3 rounded-[12px] border-b-4 px-[34px] transition-colors dark:bg-[#15181E] ${option.tint} ${LOOK[state]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={option.icon} alt="" draggable={false} className={`shrink-0 object-contain ${option.iconSize}`} />
                <span className="text-[16px] leading-none font-medium text-[#2C2C2C] dark:text-white">{option.title}</span>
                <span
                  aria-hidden
                  className={`absolute top-1/2 right-4 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-[#E5484D] transition-[scale,opacity] duration-200 ${
                    state === "wrong" ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                >
                  <X className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
