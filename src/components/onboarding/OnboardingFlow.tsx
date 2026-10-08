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
import { QuestionScreen } from "./QuestionScreen";
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

  // Bumped each time the user comes back to the sign-up screen from a
  // question, so the splash canvas replays its sign-up animations.
  const [signUpReplays, setSignUpReplays] = useState(0);

  // The sign-up buttons wait for the sign-up animation to finish (reported by
  // the splash canvas, which detects it at runtime).
  const [signUpSettled, setSignUpSettled] = useState(false);
  const previousIndexRef = useRef(index);
  useEffect(() => {
    if (index === -1 && previousIndexRef.current >= 0) setSignUpReplays((n) => n + 1);
    previousIndexRef.current = index;
  }, [index]);

  // One fox for every screen (see foxStage): screens mark where it stands,
  // and it stays put — or glides — across screen changes instead of each
  // screen fading in a fox of its own.
  const mainRef = useRef<HTMLElement>(null);

  // The splash/sign-up Rive canvas fills the space above the footer, so the
  // CTA always has room and the artboard sits identically on both screens.
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new ResizeObserver(() => setFooterHeight(footer.offsetHeight));
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  const { stage: foxStage, active: foxSlot } = useFoxStage();

  // Option/CTA taps play a click (see clickSound) — warmed up once here so
  // the first tap isn't late, and silenced by the header's sound toggle.
  useEffect(preloadClickSound, []);
  useEffect(() => setClickSoundMuted(muted), [muted]);

  // Every question opens with nothing selected — including when coming back
  // to it — so its answer is cleared on the way in.
  const goTo = (next: number) => {
    // Hide the sign-up buttons right away on the way back, before its
    // animation replays.
    if (next === -1) setSignUpSettled(false);
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

  // Only the splash's own timer calls this, once; it must not drag the user
  // forward if they have already moved on.
  const showSignUp = () => setIndex((current) => (current === -2 ? -1 : current));

  const goBack = () => {
    goTo(Math.max(-1, index - 1));
  };

  const setAnswer = (key: keyof OnboardingAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const step = index >= 0 ? ONBOARDING_STEPS[index] : null;
  // A screen's slot only unregisters once that screen has finished fading
  // out, so the fox would linger over the next screen until then. It follows
  // the current screen instead: no slot for one that doesn't place the fox
  // (the questions have their own Zox), and it's gone that instant.
  const foxOnScreen = step?.kind === "fox-message" || step?.kind === "streak";
  const isQuestion = step?.kind === "question-list" || step?.kind === "question-grid";
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
  const hideCta =
    step?.kind === "notification-permission" ||
    index === -2 ||
    (index === -1 && !signUpSettled);

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
                className="absolute inset-0 flex flex-col"
              >
                <PreLoginScreen className="flex flex-1 flex-col" />
              </motion.div>
            )}

            {step && (
              <motion.div
                // All questions share one key, so moving between questions
                // doesn't crossfade the screen (and re-animate Zox).
                key={isQuestion ? "question" : `step-${step.id}`}
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
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      voiceReadsHeading={step.voiceReadsHeading}
                      voiceReads={step.voiceReads}
                      typeSpeedMs={step.typeSpeedMs}
                      excite={step.excite}
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

                  {/* One element for list and grid questions alike, so a
                    list question followed by a grid one (or the reverse)
                    keeps the same Zox instead of remounting him. */}
                  {(step.kind === "question-list" || step.kind === "question-grid") && (
                    <QuestionScreen
                      className="flex-1"
                      questionId={step.id}
                      heading={step.heading(answers)}
                      {...(step.kind === "question-list"
                        ? { kind: step.kind, options: step.options }
                        : { kind: step.kind, options: step.options })}
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

        {/* The CTA lives here, outside the screen transitions, so it never
          remounts — a per-screen button flickered while its Rive canvas
          reloaded on each crossfade. The slot under it is tall on the
          pre-login screen (it holds the log-in line, which keeps the button
          where it is) and a short bottom padding everywhere else, so the
          button sits near the bottom edge. */}
        <div ref={footerRef} className="relative z-10 shrink-0">
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
            <motion.div
              initial={false}
              animate={{ height: index <= -1 ? 40 : 8 }}
              transition={SCREEN_TRANSITION}
              className="flex items-center justify-center"
            >
              <AnimatePresence>
                {index === -1 && signUpSettled && (
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
            </motion.div>
          </div>
        </div>

        <PersistentFox containerRef={mainRef} slot={foxOnScreen ? foxSlot : null} />

        {/* The splash/sign-up canvas stays mounted for the whole flow, so going
          back to the sign-up screen from the first question finds Hex where
          he was left — remounting restarted the splash and its timer. It sits
          behind the screens and the footer, and is hidden once past sign-up. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: index <= -1 ? 1 : 0 }}
          transition={SCREEN_TRANSITION}
          aria-hidden={index > -1}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <OnboardingSplash
            // Brand green for the splash, then the device theme from the
            // sign-up screen on.
            className={`relative h-full w-full transition-colors duration-500 ${
              index === -2
                ? "bg-gradient-to-b from-[#00E5B5] to-[#1385B3]"
                : "bg-white dark:bg-background"
            }`}
            bottomInset={footerHeight}
            replayKey={signUpReplays}
            onSignUpSettled={setSignUpSettled}
            onComplete={showSignUp}
          />
        </motion.div>
      </main>
    </FoxStageProvider>
  );
}
