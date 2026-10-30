"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { Confetti } from "./Confetti";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { BUTTON_DROP } from "./ActionRow";
import { FeedbackPanel, XpPop } from "./FeedbackPanel";
import { HintFloat } from "./HintFloat";
import { TeacherSpeech } from "./TeacherSpeech";
import { SpokenText } from "./SpokenText";
import type { TextSpan } from "@/lib/constants/onboarding";
import { moduleHref } from "@/lib/routes";
import { LevelOneShell, levelOneHref, levelOneStep } from "./LevelOneShell";

export type Step = "says" | "quiz";

const CORRECT_ID = "giving";

const QUIZ_HEADING: TextSpan[] = [{ text: "What", highlight: true }, { text: " teacher is doing?" }];
const SAYS_LINE_1: TextSpan[] = [{ text: "Imagine your", highlight: true }];
const SAYS_LINE_2: TextSpan[] = [{ text: "Teacher Says.." }];
/** When Let / Suppose / Teacher / Says are spoken in screen_3_audio.mpeg (4.03s long), measured from the clip. */
const SAYS_CLIP_SECONDS = 4.032;
const SAYS_WORD_TIMES = [[0.14, 0.34], [0.34, 0.83], [1.47, 1.8], [1.8, 2.17]] as const;
const SAYS_AUDIO = ["/audios/screen_3_audio.mpeg"];
/** Just the question; the options are not read out. */
const QUIZ_AUDIO = ["/audios/screen_4/screen_4_audio_trim.m4a"];

const OPTIONS = [
  { id: "asking", icon: "/images/level-one/asking-question.png", title: "Asking Question", tint: "bg-[#F6F4FE] dark:bg-[#1B1830]", text: "Teacher is asking a question to the class." },
  { id: "giving", icon: "/images/level-one/giving-instruction.png", title: "Giving Instruction", tint: "bg-[#FFF9F0] dark:bg-[#2A2218]", text: "Teacher is giving an instruction to the class." },
] as const;

// The teacher picture is one element across both screens: on the quiz it is
// cropped from the bottom and moves up, to make room for the options.
const IMAGE_GAP: Record<Step, number> = { says: 20, quiz: 20 };
// Frame top 163 + 240 = 403, which leaves 24px above the options at 427.
const IMAGE_HEIGHT: Record<Step, number> = { says: 358, quiz: 240 };
// After Check the picture is cropped further, so the options ride up and stay
// clear of the result panel that slides in over the bottom ~290px.
const CHECKED_IMAGE_HEIGHT = 110;
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

/** The result panel's own spring (see FeedbackPanel). */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
const MORPH = { duration: 0.8, ease: [0.65, 0, 0.35, 1] } as const;
/** Heading box heights: two lines on "Teacher Says", one on the quiz. */
const TITLE_HEIGHT: Record<Step, number> = { says: 92, quiz: 36 };

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
  // Opened straight on the quiz (a jump, or coming back from a later screen).
  const [openedOnQuiz] = useState(urlStep === "quiz");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Once checked, the answer is locked and the right/wrong marks show.
  const [checked, setChecked] = useState(false);
  const quiz = step === "quiz";
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  // Once the hinted card has finished flipping, Hex floats over to it.
  const [flipped, setFlipped] = useState(false);

  const show = (next: Step) => {
    // Coming back to the quiz later starts it fresh.
    if (next === "says") {
      setSelectedId(null);
      setHinted(false);
      setFlipped(false);
      setChecked(false);
      // The button (and bar) go back to their resting state too.
      setAnswer(null);
    }
    setStep(next);
  };
  const [lastUrlStep, setLastUrlStep] = useState(urlStep);
  if (urlStep !== lastUrlStep) {
    setLastUrlStep(urlStep);
    if (urlStep !== step) show(urlStep);
  }

  return (
    <LevelOneShell
      step={levelOneStep(quiz ? 4 : 3)}
      answer={answer}
      // The quiz's question is read once, until it is checked.
      voiceover={quiz ? (checked ? undefined : QUIZ_AUDIO) : SAYS_AUDIO}
      ctaDisabled={quiz && selectedId === null}
      ctaLabel={quiz && !checked ? "Check" : "Continue"}
      onBack={() => {
        if (!quiz) return router.push(moduleHref(levelOneStep(3) - 1));
        show("says");
        router.push(levelOneHref(3));
      }}
      overlay={
        <>
          {quiz && (
            <FeedbackPanel key="feedback" correct={selectedId === CORRECT_ID} open={checked}
              hexIn={checked}
              hexCue={selectedId === CORRECT_ID ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            >
              {selectedId === CORRECT_ID ? "Yes! " : "Remember: "}The teacher is giving an <b>instruction.</b>
            </FeedbackPanel>
          )}
        </>
      }
      onContinue={() => {
        if (!quiz) {
          show("quiz");
          router.push(levelOneHref(4));
        } else if (!checked) {
          setChecked(true);
          noteAnswer(levelOneStep(4), selectedId === CORRECT_ID);
          vibrateForAnswer(selectedId === CORRECT_ID);
          setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: selectedId === CORRECT_ID }));
        }
        else router.push(nextAfter(levelOneStep(4), selectedId === CORRECT_ID, levelOneHref(5)));
      }}
    >
      {/* The heading box resizes with the picture, so nothing jumps when the
        two headings swap: they cross-fade inside it while it animates. */}
      <motion.div
        initial={false}
        animate={{ height: TITLE_HEIGHT[step] }}
        transition={MORPH}
        className="relative mt-5 w-full shrink-0"
      >
        <AnimatePresence initial={false}>
          {quiz ? (
            <motion.h1
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 top-0 text-center text-[28px] leading-9 font-semibold text-[#2C2C2C] dark:text-white"
            >
              <SpokenText spans={QUIZ_HEADING} />
            </motion.h1>
          ) : (
            <motion.h1
              key="says"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 top-0 flex flex-col items-center gap-3.5 text-center"
            >
              <span className="text-[28px] leading-[1.34] font-semibold">
                <SpokenText spans={SAYS_LINE_1} timing={{ clipSeconds: SAYS_CLIP_SECONDS, times: SAYS_WORD_TIMES, before: 0 }} />
              </span>
              <span className="text-[40px] leading-none font-semibold text-[#444444] dark:text-white">
                <SpokenText spans={SAYS_LINE_2} timing={{ clipSeconds: SAYS_CLIP_SECONDS, times: SAYS_WORD_TIMES, before: 2 }} />
              </span>
            </motion.h1>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The picture keeps its width and its place from the top across both
        screens; on the quiz it is cropped from the bottom and moves up to
        make room for the options. Hex and the teacher's speech bubble sit over
        it on both screens (TeacherSpeech), until the answer is checked and
        the result panel brings its own Hex. */}
      <motion.div
        initial={false}
        animate={{ marginTop: IMAGE_GAP[step], height: checked ? CHECKED_IMAGE_HEIGHT : IMAGE_HEIGHT[step] }}
        // On Check the picture closes on the very spring the result panel slides
        // up with, so the options rise as the panel arrives, as if it pushed them.
        transition={checked ? PANEL_SPRING : MORPH}
        className="relative w-full shrink-0"
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/level-one/teacher-says.png"
            alt="A teacher saying: Open your notebook"
            draggable={false}
            className="h-[358px] w-full rounded-lg object-cover object-top"
          />
        </div>
        {/* Hex stays through the pick and the check; the options slide up over him. */}
        <TeacherSpeech key="speech" tucked={checked} hexToCard={hinted && flipped} skipIntro={openedOnQuiz || quiz} />
      </motion.div>

      <AnimatePresence>
        {quiz && (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.25 } }}
            transition={{
              opacity: { duration: 0.3, delay: 0.3 },
              y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 },
            }}
            // 48px below the cropped picture; 80 once "+10 XP" floats above a card;
            // the button's drop on top, so the options keep their gap to it.
            style={{ marginTop: (checked && selectedId === CORRECT_ID ? 80 : 48) + BUTTON_DROP }}
            className="relative z-10 flex w-full shrink-0 items-start gap-[19px] bg-white transition-[margin-top] duration-300 dark:bg-background"
          >
            {OPTIONS.map((option) => {
              const state = optionState(option.id, selectedId, checked);
              return (
                <HintFloat key={option.id} className="flex min-w-0 flex-1" active={hinted && selectedId === null && option.id === CORRECT_ID} onFlipEnd={() => setFlipped(true)}>
                <motion.button
                  animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  type="button"
                  disabled={checked}
                  onClick={() => {
                    playClickSound();
                    vibrateForTap();
                    setSelectedId(option.id);
                  }}
                  aria-pressed={state === "selected"}
                  className={`relative flex h-[221px] min-w-0 flex-1 flex-col items-center justify-center gap-3.5 rounded-[8px] border-4 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[color,background-color,border-color,box-shadow] ${
                    state === "idle" ? `border-white dark:border-transparent ${option.tint}` : LOOKS[state].card
                  } ${hinted && state === "idle" && option.id === CORRECT_ID ? "bg-[#FFF3E8]! shadow-[0_0_14px_2px_rgba(255,141,66,0.25)]! duration-[2500ms] dark:bg-[#2A1E12]!" : ""}`}
                >
                  <XpPop show={checked && option.id === CORRECT_ID && selectedId === CORRECT_ID} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={option.icon} alt="" draggable={false} className="h-[100px] w-[100px] shrink-0 object-contain" />
                  <span className="text-[16px] leading-none font-semibold text-[#444444] dark:text-white">
                    {option.title}
                  </span>
                </motion.button>
                </HintFloat>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
