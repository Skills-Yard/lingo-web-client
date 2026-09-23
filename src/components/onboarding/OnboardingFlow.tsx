"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ONBOARDING_STEPS,
  ONBOARDING_QUESTION_COUNT,
  type OnboardingAnswers,
} from "@/lib/constants/onboarding";
import { PreLoginScreen } from "./PreLoginScreen";
import { OnboardingSplash } from "./robu/OnboardingSplash";
import { OnboardingHeader } from "./OnboardingHeader";
import { FoxMessageScreen } from "./FoxMessageScreen";
import { NotificationPermissionScreen } from "./NotificationPermissionScreen";
import { QuestionListScreen } from "./QuestionListScreen";
import { QuestionGridScreen } from "./QuestionGridScreen";

// 1-indexed position of each question-kind step among *only* the question
// steps, keyed by step id — e.g. `{ career: 1, experience: 2, ... }`. Built
// once at module scope (the step list is static) rather than recomputed on
// every render; drives the header's "question N of ONBOARDING_QUESTION_COUNT"
// progress bar, which only advances on question screens, not the
// fox-message/notification connector screens between them.
const QUESTION_NUMBER: Record<string, number> = {};
{
  let n = 0;
  for (const step of ONBOARDING_STEPS) {
    if (step.kind === "question-list" || step.kind === "question-grid") {
      n += 1;
      QUESTION_NUMBER[step.id] = n;
    }
  }
}

// Every screen swap in this flow (splash -> pre-login -> each question) uses
// this same crossfade — `mode="sync"` on the AnimatePresence below lets the
// leaving screen fade out while the entering one fades in at the same time,
// rather than waiting for one to finish before starting the other, which is
// what actually reads as "smooth" instead of a blank flash in between.
const SCREEN_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

interface OnboardingFlowProps {
  /** Fired after the last question's "Continue" — nothing past this point
   * exists in the reference design yet, so the caller decides what (if
   * anything) comes next. */
  onComplete?: () => void;
}

/**
 * The full onboarding flow: OnboardingSplash, then PreLoginScreen, then
 * `ONBOARDING_STEPS` in order. `index` of `-2` means the splash, `-1` means
 * PreLoginScreen, `0..ONBOARDING_STEPS.length-1` indexes into the steps
 * array. A plain `useState` index (not routing) — same "one component owns
 * the whole walkthrough" shape instructions-intro's own InstructionsIntroFlow
 * uses. Going back from PreLoginScreen doesn't return to the splash — same
 * one-shot-entrance reasoning instructions-intro's own RobuSplash uses (see
 * its doc comment): it's Robu's boot-up moment, not a screen to revisit.
 *
 * All three "phases" (splash, pre-login, the current step) render inside one
 * `AnimatePresence` rather than as separate early-returned `<main>`s — that
 * was a plain unmount/mount swap with no transition at all between them.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [index, setIndex] = useState(-2);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [muted, setMuted] = useState(false);

  const goNext = () => {
    if (index >= ONBOARDING_STEPS.length - 1) {
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => {
    setIndex((i) => Math.max(-1, i - 1));
  };

  const setAnswer = (key: keyof OnboardingAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const step = index >= 0 ? ONBOARDING_STEPS[index] : null;
  const questionNumber = step ? QUESTION_NUMBER[step.id] : undefined;
  const progress = questionNumber
    ? { step: questionNumber, total: ONBOARDING_QUESTION_COUNT }
    : undefined;

  return (
    <main className="onboarding-light relative h-screen w-full overflow-hidden bg-white">
      <AnimatePresence mode="sync">
        {index === -2 && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SCREEN_TRANSITION}
            className="absolute inset-0"
          >
            <OnboardingSplash className="relative h-full w-full" onComplete={goNext} />
          </motion.div>
        )}

        {index === -1 && (
          <motion.div
            key="prelogin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SCREEN_TRANSITION}
            className="absolute inset-0 flex flex-col bg-white"
          >
            <PreLoginScreen className="flex flex-1 flex-col" onGetStarted={goNext} />
          </motion.div>
        )}

        {step && (
          <motion.div
            key={`step-${step.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SCREEN_TRANSITION}
            className="absolute inset-0 flex flex-col bg-white"
          >
            <OnboardingHeader
              onBack={goBack}
              progress={progress}
              muted={muted}
              onToggleMuted={() => setMuted((m) => !m)}
            />

            {step.kind === "fox-message" && (
              <FoxMessageScreen
                className="flex-1"
                heading={step.heading?.(answers)}
                sparkle={step.sparkle}
                bubble={step.bubble(answers)}
                cta={step.cta}
                onContinue={goNext}
              />
            )}

            {step.kind === "notification-permission" && (
              <NotificationPermissionScreen
                className="flex-1"
                heading={step.heading}
                cta={step.cta}
                onContinue={goNext}
              />
            )}

            {step.kind === "question-list" && (
              <QuestionListScreen
                className="flex-1"
                heading={step.heading(answers)}
                options={step.options}
                selectedId={answers[step.answerKey] ?? null}
                onSelect={(id) => setAnswer(step.answerKey, id)}
                cta={step.cta}
                onContinue={goNext}
              />
            )}

            {step.kind === "question-grid" && (
              <QuestionGridScreen
                className="flex-1"
                heading={step.heading(answers)}
                options={step.options}
                selectedId={answers[step.answerKey] ?? null}
                onSelect={(id) => setAnswer(step.answerKey, id)}
                cta={step.cta}
                onContinue={goNext}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
