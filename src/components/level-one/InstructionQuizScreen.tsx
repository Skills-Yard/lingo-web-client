"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { playClickSound } from "@/components/onboarding/clickSound";
import { optionDropIn } from "@/components/onboarding/optionCard";
import { Confetti } from "./Confetti";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { FeedbackPanel } from "./FeedbackPanel";
import { HexGlide } from "./HexStage";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { LOOKS, optionState } from "./TeacherFlow";

const CORRECT_ID = "command";
/** The `entryStyle` Hex enters with here (set before the entrance trigger). */
const HEX_ENTRY_STYLE = 6;

const OPTIONS = [
  { id: "statement", icon: "/images/level-one/statement.png", title: "Statement" },
  { id: "command", icon: "/images/level-one/command.png", title: "Command" },
  { id: "question", icon: "/images/level-one/question.png", title: "Question" },
] as const;

const QUIZ_AUDIO = ["/audios/screen_6_audio.mpeg"];

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
      voiceover={QUIZ_AUDIO}
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

      <div className="mt-5 flex w-full max-w-[358px] shrink-0 flex-col gap-[18px]">
        {OPTIONS.map((option, i) => {
          const state = optionState(option.id, selectedId, checked, CORRECT_ID);
          const look = LOOKS[state];
          return (
            // The khaki bottom edge is the wrapper's 6px border; the card sits
            // flat on top of it and turns green/red with the result.
            <motion.div
              key={option.id}
              {...optionDropIn(i)}
              className={`rounded-sm border-b-[6px] transition-colors ${look.edge}`}
            >
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
            </motion.div>
          );
        })}
      </div>
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
