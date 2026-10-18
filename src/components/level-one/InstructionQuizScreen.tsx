"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/components/onboarding/clickSound";
import { optionDropIn } from "@/components/onboarding/optionCard";
import { Confetti } from "./Confetti";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { FeedbackPanel } from "./FeedbackPanel";
import { HexGlide } from "./HexStage";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { optionState } from "./TeacherFlow";

const CORRECT_ID = "command";
/** The `entryStyle` Hex enters with here (set before the entrance trigger). */
const HEX_ENTRY_STYLE = 6;

const OPTIONS = [
  { id: "statement", icon: "/images/level-one/statement.png", title: "Statement", tint: "bg-[#F6F4FE]", iconSize: "h-9 w-[31px]" },
  { id: "command", icon: "/images/level-one/command.png", title: "Command", tint: "bg-[#FFF4F6]", iconSize: "h-8 w-[26px]" },
  { id: "question", icon: "/images/level-one/question.png", title: "Question", tint: "bg-[#FFF5EE]", iconSize: "h-[31px] w-[38px]" },
] as const;

/** The card's 4px outline: white at rest, coloured once picked / marked. */
const OUTLINE = {
  idle: "border-white dark:border-white/10",
  selected: "border-primary",
  correct: "border-primary",
  wrong: "border-[#E5484D]",
} as const;

/**
 * `/module?level=1&step=6` — "What are instructions known as?": a single-answer quiz
 * with Hex between the question and the options. Check locks the answer and
 * marks it right (green) or wrong (red); Continue follows.
 */
export function InstructionQuizScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  // Hex is never replaced: one Hex sits in the question's slot and, on Check,
  // glides into the result panel's slot as the panel comes up.
  const glideRef = useRef<HTMLDivElement>(null);
  const [questionSlot, setQuestionSlot] = useState<HTMLDivElement | null>(null);
  const [panelSlot, setPanelSlot] = useState<HTMLDivElement | null>(null);

  return (
    <LevelOneShell
      step={6}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : "Check"}
      onBack={() => router.push(levelOneHref(5))}
      onContinue={() => {
        if (!checked) setChecked(true);
        else (onContinue ?? (() => router.push(levelOneHref(7))))();
      }}
      overlay={
        <div ref={glideRef} className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            key="feedback"
            correct={selectedId === CORRECT_ID}
            open={checked}
            hexIn={checked}
            hexSlot={setPanelSlot}
          >
            {selectedId === CORRECT_ID ? "Yes! " : "Remember: "}Instructions in a program{" "}
            {selectedId === CORRECT_ID ? "is" : "are"} called <b>commands.</b>
          </FeedbackPanel>
          <HexGlide entryStyle={HEX_ENTRY_STYLE} fromEl={questionSlot} toEl={panelSlot} moved={checked}
            arrivedCue={selectedId === CORRECT_ID ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            containerRef={glideRef} />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mt-9 flex w-full max-w-[358px] shrink-0 items-center gap-3"
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
        moves it into the result panel on Check; the slot then closes and the
        options slide up into its space. */}
      <motion.div
        ref={setQuestionSlot}
        aria-hidden
        className="pointer-events-none w-[180px] shrink-0"
        initial={false}
        animate={checked ? { height: 0, marginTop: 0 } : { height: 150, marginTop: 8 }}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
      />

      <div className="relative mt-5 w-full max-w-[359px] shrink-0">
        <div aria-hidden className="absolute inset-x-[30px] top-[17px] bottom-[8px] bg-[#0CA9B4]/10 blur-[23.7px]" />
        <div className="relative flex flex-col gap-[23px]">
          {OPTIONS.map((option, i) => {
            const state = optionState(option.id, selectedId, checked, CORRECT_ID);
            return (
              <motion.button
                key={option.id}
                {...optionDropIn(i)}
                type="button"
                disabled={checked}
                onClick={() => {
                  playClickSound();
                  setSelectedId(option.id);
                }}
                aria-pressed={state === "selected"}
                className={`relative flex h-[89px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[26px] border-4 transition-colors dark:bg-[#15181E] ${option.tint} ${OUTLINE[state]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={option.icon} alt="" draggable={false} className={`shrink-0 object-contain ${option.iconSize}`} />
                <span className="text-[16px] leading-none font-medium text-[#2C2C2C] dark:text-white">{option.title}</span>
                <span
                  aria-hidden
                  className={`absolute top-1/2 right-4 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full transition-[scale,opacity] duration-200 ${
                    state === "idle" ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  } ${state === "wrong" ? "bg-[#E5484D]" : "bg-linear-to-b from-[#00B8A9] to-[#1287B3]"}`}
                >
                  {state === "wrong" ? (
                    <X className="h-4 w-4 text-white" strokeWidth={3} />
                  ) : (
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  )}
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
