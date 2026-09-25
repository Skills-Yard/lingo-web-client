"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ONBOARDING_STEPS,
  resolveVoiceover,
  type OnboardingAnswers,
} from "@/lib/constants/onboarding";
import { PreLoginScreen } from "./PreLoginScreen";
import { OnboardingSplash } from "./robu/OnboardingSplash";
import { OnboardingHeader } from "./OnboardingHeader";
import { FoxMessageScreen } from "./FoxMessageScreen";
import { NotificationPermissionScreen } from "./NotificationPermissionScreen";
import { QuestionListScreen } from "./QuestionListScreen";
import { QuestionGridScreen } from "./QuestionGridScreen";
import { StreakScreen } from "./StreakScreen";
import { FoxStageProvider, PersistentFox, useFoxStage } from "./foxStage";
import { playClickSound, preloadClickSound, setClickSoundMuted } from "./clickSound";
import { Button3D } from "@/components/ui/Button3D";

// 1-indexed position of each question-kind step among *only* the question
// steps, keyed by step id — e.g. `{ career: 1, experience: 2, ... }`. Built
// once at module scope (the step list is static) rather than recomputed on
// every render; drives the header's "question N of QUESTION_COUNT"
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

/** How many questions the progress bar counts ("N of QUESTION_COUNT"). */
const QUESTION_COUNT = Object.keys(QUESTION_NUMBER).length;

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

  // One fox for every screen (see foxStage): screens mark where it stands,
  // and it stays put — or glides — across screen changes instead of each
  // screen fading in a fox of its own.
  const mainRef = useRef<HTMLElement>(null);
  const { stage: foxStage, active: foxSlot } = useFoxStage();

  // Option/CTA taps play a click (see clickSound) — warmed up once here so
  // the first tap isn't late, and silenced by the header's sound toggle.
  useEffect(preloadClickSound, []);
  useEffect(() => setClickSoundMuted(muted), [muted]);

  // Every question opens with nothing selected — including when coming back
  // to it — so its answer is cleared on the way in.
  const goTo = (next: number) => {
    const target = ONBOARDING_STEPS[next];
    if (target && (target.kind === "question-list" || target.kind === "question-grid")) {
      setAnswers((prev) => ({ ...prev, [target.answerKey]: undefined }));
    }
    setIndex(next);
  };

  const goNext = () => {
    if (index >= ONBOARDING_STEPS.length - 1) {
      onComplete?.();
      return;
    }
    goTo(index + 1);
  };

  const goBack = () => {
    goTo(Math.max(-1, index - 1));
  };

  const setAnswer = (key: keyof OnboardingAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const step = index >= 0 ? ONBOARDING_STEPS[index] : null;
  const questionNumber = step ? QUESTION_NUMBER[step.id] : undefined;
  const progress = questionNumber
    ? { step: questionNumber, total: QUESTION_COUNT }
    : undefined;

  // The one CTA for the whole flow (see the footer below): its label,
  // enabled state and action follow whichever screen is current.
  const ctaLabel = step ? step.cta : "Get Started";
  const ctaDisabled =
    index < -1 ||
    ((step?.kind === "question-list" || step?.kind === "question-grid") &&
      !answers[step.answerKey]);
  const requestNotifications = () => {
    if ("Notification" in window) Notification.requestPermission().catch(() => {});
  };
  const handleCta = goNext;

  // The notification screen answers through its own prompt (Allow / Don't
  // Allow), so the footer CTA fades out there — it keeps its space, so the
  // screen's layout doesn't jump as it goes.
  const hideCta = step?.kind === "notification-permission";

  // `h-dvh`, not `h-screen`: on mobile, 100vh is the height with the
  // browser's address bar hidden, so whenever the bar is showing the flow ran
  // taller than the visible area and the page scrolled. `dvh` tracks the
  // actually-visible height, so every screen fits on one screen.
  return (
    <FoxStageProvider stage={foxStage}>
      <main
        ref={mainRef}
        className="onboarding-light relative flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-background"
      >
        {/* Screens crossfade in the space above the footer. */}
        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="sync">
            {index === -1 && (
              <motion.div
                key="prelogin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SCREEN_TRANSITION}
                className="absolute inset-0 flex flex-col bg-white dark:bg-background"
              >
                <PreLoginScreen className="flex flex-1 flex-col" />
              </motion.div>
            )}

            {step && (
              <motion.div
                key={`step-${step.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SCREEN_TRANSITION}
                className="absolute inset-0 flex flex-col bg-white dark:bg-background"
              >
                {/* Phone-width column, centered on tablets/desktops so options
                  don't stretch across a wide screen. */}
                <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
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
                      headingPlacement={step.headingPlacement}
                      sparkle={step.sparkle}
                      bubble={step.bubble(answers)}
                      greet={step.greet}
                      excite={step.excite}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                    voiceReadsHeading={step.voiceReadsHeading}
                      voiceReads={step.voiceReads}
                      muted={muted}
                    />
                  )}

                  {step.kind === "notification-permission" && (
                    <NotificationPermissionScreen
                      className="flex-1"
                      heading={step.heading}
                      onAllow={() => {
                        playClickSound();
                        requestNotifications();
                        goNext();
                      }}
                      onDeny={() => {
                        playClickSound();
                        goNext();
                      }}
                    />
                  )}

                  {step.kind === "streak" && (
                    <StreakScreen className="flex-1" heading={step.heading(answers)} image={step.image} />
                  )}

                  {step.kind === "question-list" && (
                    <QuestionListScreen
                      className="flex-1"
                      heading={step.heading(answers)}
                      options={step.options}
                      selectedId={answers[step.answerKey] ?? null}
                      onSelect={(id) => setAnswer(step.answerKey, id)}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      muted={muted}
                    />
                  )}

                  {step.kind === "question-grid" && (
                    <QuestionGridScreen
                      className="flex-1"
                      heading={step.heading(answers)}
                      options={step.options}
                      selectedId={answers[step.answerKey] ?? null}
                      onSelect={(id) => setAnswer(step.answerKey, id)}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      muted={muted}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The CTA lives here, outside the screen transitions, so it's the same
          size and in the same spot on every screen and never remounts — a
          per-screen button flickered while its Rive canvas reloaded on each
          crossfade. The slot under it has a fixed height on every screen
          (only Get Started fills it, with the log-in line), so switching
          screens never nudges the button. */}
        <div className="shrink-0">
          <div className="mx-auto w-full max-w-[22rem] px-4">
            <motion.div
              initial={false}
              animate={{ opacity: hideCta ? 0 : 1 }}
              transition={SCREEN_TRANSITION}
              aria-hidden={hideCta}
              inert={hideCta}
              className={hideCta ? "pointer-events-none" : undefined}
            >
              <Button3D
                onClick={handleCta}
                onPress={playClickSound}
                disabled={ctaDisabled || hideCta}
                className="w-full"
              >
                {ctaLabel}
              </Button3D>
            </motion.div>
            <div className="flex h-10 items-center justify-center">
              <AnimatePresence>
                {index === -1 && (
                  <motion.p
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SCREEN_TRANSITION}
                    className="text-center text-sm text-[#666666] sm:text-base"
                  >
                    Already have an account?{" "}
                    {/* No login route exists yet, so this is inert for now. */}
                    <button type="button" className="font-medium text-foreground" aria-disabled>
                      Log in
                    </button>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <PersistentFox containerRef={mainRef} slot={foxSlot} />

        {/* The splash covers everything, footer included — which also lets the
          footer's Rive button load behind it, ready before Get Started. */}
        <AnimatePresence>
          {index === -2 && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_TRANSITION}
              className="absolute inset-0 z-10"
            >
              <OnboardingSplash className="relative h-full w-full" onComplete={goNext} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </FoxStageProvider>
  );
}
