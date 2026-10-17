"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/components/onboarding/clickSound";
import { HEX_EXIT_MS } from "@/lib/rive/runtime";
import { Confetti } from "./Confetti";
import { FeedbackPanel, OnboardingHex } from "./FeedbackPanel";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { LOOKS, optionState } from "./TeacherFlow";

const CORRECT_ID = "command";
/** How long Hex's exit takes before the result panel comes up. */
const EXIT_DONE_MS = HEX_EXIT_MS;

const OPTIONS = [
  { id: "statement", icon: "/images/level-one/statement.png", title: "Statement" },
  { id: "command", icon: "/images/level-one/command.png", title: "Command" },
  { id: "question", icon: "/images/level-one/question.png", title: "Question" },
] as const;

/**
 * `/module?level=1&step=5` — "What are instructions known as?": a single-answer quiz
 * with Hex between the question and the options. Check locks the answer and
 * marks it right (green) or wrong (red); Continue follows.
 */
export function InstructionQuizScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  // Hex has finished leaving (exit right): the space closes and only now does
  // the result panel come up, with Hex entering in it.
  const [hexGone, setHexGone] = useState(false);
  useEffect(() => {
    if (!checked) return;
    const timer = window.setTimeout(() => setHexGone(true), EXIT_DONE_MS);
    return () => window.clearTimeout(timer);
  }, [checked]);

  return (
    <LevelOneShell
      step={5}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : "Check"}
      onBack={() => router.push(levelOneHref(4))}
      onContinue={() => {
        if (!checked) setChecked(true);
        else (onContinue ?? (() => router.push(levelOneHref(6))))();
      }}
      overlay={
        <AnimatePresence>
          {hexGone && (
            <FeedbackPanel key="feedback" correct={selectedId === CORRECT_ID} hexIn>
              {selectedId === CORRECT_ID ? "Yes! " : "Remember: "}Instructions in a program{" "}
              {selectedId === CORRECT_ID ? "is" : "are"} called <b>commands.</b>
            </FeedbackPanel>
          )}
        </AnimatePresence>
      }
    >
      <div className="mt-9 flex w-full max-w-[358px] shrink-0 items-center gap-3">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#04ACAB]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/level-one/q-badge.png" alt="Question" draggable={false} className="h-[26px] w-[30px] object-contain" />
        </span>
        <h1 className="text-[24px] leading-8 font-semibold text-[#2C2C2C] dark:text-white">
          What are <span className="text-[#00B8A9]">instructions</span> known as?
        </h1>
      </div>

      {/* Hex leaves (exit right) when the answer is checked, the space closes
        up behind him, and he enters again in the feedback panel. */}
      <AnimatePresence initial={false}>
        {!hexGone && (
          <motion.div
            key="hex"
            aria-hidden
            className="pointer-events-none mt-2 w-[180px] shrink-0 overflow-visible"
            initial={{ height: 150 }}
            animate={{ height: 150 }}
            exit={{ height: 0, marginTop: 0, transition: { duration: 0.5, ease: [0.45, 0, 0.2, 1] } }}
          >
            <div className="h-[150px] w-full">
              <OnboardingHex entryKey="quiz" leaving={checked} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex w-full max-w-[358px] shrink-0 flex-col gap-[18px]">
        {OPTIONS.map((option) => {
          const state = optionState(option.id, selectedId, checked, CORRECT_ID);
          const look = LOOKS[state];
          return (
            // The khaki bottom edge is the wrapper's 6px border; the card sits
            // flat on top of it and turns green/red with the result.
            <div key={option.id} className={`rounded-sm border-b-[6px] transition-colors ${look.edge}`}>
              <button
                type="button"
                disabled={checked}
                onClick={() => {
                  playClickSound();
                  setSelectedId(option.id);
                }}
                aria-pressed={state === "selected"}
                className={`flex h-[62px] w-full items-center justify-between gap-[15px] rounded-t-lg border px-4 py-2 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-colors ${look.card}`}
              >
                <span className="flex items-center gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={option.icon} alt="" draggable={false} className="h-[46px] w-[46px] shrink-0 object-contain" />
                  <span className="text-[16px] leading-none font-medium text-[#2C2C2C] dark:text-white">
                    {option.title}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full p-1 transition-colors ${look.radio}`}
                >
                  <span className={`h-full w-full rounded-full transition-[scale,background-color] duration-200 ${look.dot}`} />
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
