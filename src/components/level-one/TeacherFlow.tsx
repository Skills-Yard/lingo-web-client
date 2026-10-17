"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Confetti } from "./Confetti";
import { FeedbackPanel, PANEL_HEX_DELAY_MS } from "./FeedbackPanel";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";

export type Step = "says" | "quiz";

const CORRECT_ID = "giving";

const OPTIONS = [
  { id: "asking", icon: "/images/level-one/asking-question.png", title: "Asking Question", text: "Teacher is asking a question to the class." },
  { id: "giving", icon: "/images/level-one/giving-instruction.png", title: "Giving Instruction", text: "Teacher is giving an instruction to the class." },
] as const;

// The teacher picture is one element across both screens: on the quiz it is
// cropped from the bottom and moves up, to make room for the options.
const IMAGE_WIDTH: Record<Step, number> = { says: 346, quiz: 358 };
const IMAGE_HEIGHT: Record<Step, number> = { says: 346, quiz: 296 };
const IMAGE_GAP: Record<Step, number> = { says: 48, quiz: 18 };
export type OptionState = "idle" | "selected" | "correct" | "wrong";

/** After Check, the right answer is always green, and a wrong pick red. */
export const optionState = (
  id: string,
  selectedId: string | null,
  checked: boolean,
  correctId: string = CORRECT_ID,
): OptionState => {
  if (checked && id === correctId) return "correct";
  if (checked && id === selectedId) return "wrong";
  return id === selectedId ? "selected" : "idle";
};

export const LOOKS: Record<OptionState, { edge: string; card: string; radio: string; dot: string }> = {
  idle: {
    edge: "border-[#BDBA99]",
    card: "border-black/4 bg-white dark:border-white/6 dark:bg-[#15181E]",
    radio: "bg-[#D9D9D9]/8 shadow-[inset_0_0_3.8px_4px_rgba(0,0,0,0.1)]",
    dot: "scale-0",
  },
  selected: {
    edge: "border-[#008566]",
    card: "border-primary bg-[#F2FBF8] dark:bg-[#0F2921]",
    radio: "border-2 border-primary",
    dot: "scale-100 bg-primary",
  },
  correct: {
    edge: "border-[#008566]",
    card: "border-primary bg-[#F2FBF8] dark:bg-[#0F2921]",
    radio: "border-2 border-primary",
    dot: "scale-100 bg-primary",
  },
  wrong: {
    edge: "border-[#B3261E]",
    card: "border-[#E5484D] bg-[#FFF1F1] dark:bg-[#2A1517]",
    radio: "border-2 border-[#E5484D]",
    dot: "scale-100 bg-[#E5484D]",
  },
};

const MORPH = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Level 1's screens 2 and 3 ("Let Suppose / Teacher Says", then "What
 * teacher is doing?"). Both are one screen with a step, so the picture can
 * animate between them instead of remounting. `step` is the URL's: a tap
 * moves the screen at once and the URL follows; the browser's Back/Forward
 * move the URL, and the screen follows that.
 */
export function TeacherFlow({ step: urlStep = "says" }: { step?: Step }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(urlStep);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Once checked, the answer is locked and the right/wrong marks show.
  const [checked, setChecked] = useState(false);
  const quiz = step === "quiz";

  const show = (next: Step) => {
    // Coming back to the quiz later starts it fresh.
    if (next === "says") {
      setSelectedId(null);
      setChecked(false);
    }
    setStep(next);
  };
  const [lastUrlStep, setLastUrlStep] = useState(urlStep);
  if (urlStep !== lastUrlStep) {
    setLastUrlStep(urlStep);
    if (urlStep !== step) show(urlStep);
  }
  // Hex enters the result panel a beat after Check.
  const [panelHexIn, setPanelHexIn] = useState(false);
  useEffect(() => {
    if (!checked) {
      setPanelHexIn(false);
      return;
    }
    const timer = window.setTimeout(() => setPanelHexIn(true), PANEL_HEX_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [checked]);

  return (
    <LevelOneShell
      step={quiz ? 3 : 2}
      ctaDisabled={quiz && selectedId === null}
      ctaLabel={quiz && !checked ? "Check" : "Continue"}
      onBack={() => {
        if (!quiz) return router.push(levelOneHref(1));
        show("says");
        router.push(levelOneHref(2));
      }}
      overlay={
        <AnimatePresence>
          {quiz && checked && (
            <FeedbackPanel key="feedback" correct={selectedId === CORRECT_ID} hexIn={panelHexIn}>
              {selectedId === CORRECT_ID ? "Yes! " : "Remember: "}The teacher is giving an <b>instruction.</b>
            </FeedbackPanel>
          )}
        </AnimatePresence>
      }
      onContinue={() => {
        if (!quiz) {
          show("quiz");
          router.push(levelOneHref(3));
        } else if (!checked) setChecked(true);
        else router.push(levelOneHref(4));
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {quiz ? (
          <motion.h1
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // The progress bar ends 93px from the top; 26px below it (119px), 32px tall.
            className="mt-9 h-8 w-full shrink-0 text-center text-[24px] leading-8 font-semibold text-[#2C2C2C] dark:text-white"
          >
            <span className="text-[#00B8A9]">What</span> teacher is doing?
          </motion.h1>
        ) : (
          <motion.h1
            key="says"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-9 flex shrink-0 flex-col items-center text-center"
          >
            <span className="text-[20px] leading-[1.34] font-semibold text-[#00B8A9]">Let Suppose</span>
            <span className="text-[32px] leading-[1.25] font-bold text-[#2C2C2C] dark:text-white">Teacher Says</span>
          </motion.h1>
        )}
      </AnimatePresence>

      <motion.img
        src="/images/level-one/teacher.png"
        alt="A teacher saying: Open your notebook"
        draggable={false}
        initial={false}
        animate={{ width: IMAGE_WIDTH[step], height: IMAGE_HEIGHT[step], marginTop: IMAGE_GAP[step] }}
        transition={MORPH}
        className="max-w-full shrink-0 rounded-lg object-cover object-top"
      />

      <AnimatePresence>
        {quiz && (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 flex w-full max-w-[358px] shrink-0 flex-col gap-[18px]"
          >
            {OPTIONS.map((option) => {
              const state = optionState(option.id, selectedId, checked);
              const look = LOOKS[state];
              return (
                // The khaki bottom edge is the wrapper's 6px border; the card
                // sits flat on top of it. It turns green/red with the result.
                <div
                  key={option.id}
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
                    className={`flex h-[78px] w-full items-center justify-between gap-[15px] rounded-t-lg border px-4 py-2.5 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-colors ${look.card}`}
                  >
                    <span className="flex items-center gap-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={option.icon} alt="" draggable={false} className="h-[57px] w-[61px] shrink-0 object-contain" />
                      <span className="flex w-[185px] flex-col gap-2">
                        <span className="text-[16px] leading-none font-medium text-[#2C2C2C] dark:text-white">
                          {option.title}
                        </span>
                        <span className="text-[12px] leading-[1.4] font-medium text-[#666666] dark:text-white/70">
                          {option.text}
                        </span>
                      </span>
                    </span>
                    {/* Ring with a filled dot inside, padded away from the edge. */}
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
          </motion.div>
        )}
      </AnimatePresence>
      {/* Room for the result panel, so the options can scroll above it. */}
      {checked && <div aria-hidden className="h-[130px] shrink-0" />}
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
