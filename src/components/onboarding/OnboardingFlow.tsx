"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ONBOARDING_STEPS,
  TIME_SLIDER,
  resolveVoiceover,
  type OnboardingAnswers,
  type OnboardingStep,
} from "@/lib/constants/onboarding";
import { PreLoginScreen } from "./PreLoginScreen";
import { OnboardingSplash } from "./robu/OnboardingSplash";
import { OnboardingHeader } from "./OnboardingHeader";
import { FoxMessageScreen } from "./FoxMessageScreen";
import { NotificationPermissionScreen } from "./NotificationPermissionScreen";
import { QuestionScreen } from "./QuestionScreen";
import { StreakScreen } from "./StreakScreen";
import { NameScreen } from "./NameScreen";
import { TimeSliderScreen } from "./TimeSliderScreen";
import type { HexExitRequest } from "./robu/hexExit";
import { HEX_ENTER_STYLE, HEX_ENTRY_STYLE_BY_STEP, HEX_EXIT_BOTTOM_MS, HEX_EXIT_MS } from "@/lib/rive/runtime";
import { FoxStageProvider, PersistentFox, useFoxStage } from "./foxStage";
import { HexBackground } from "./robu/HexBackground";
import { DevPanel } from "./DevPanel";
import { playClickSound, preloadClickSound, setClickSoundMuted } from "./clickSound";
import { Button3D } from "@/components/ui/Button3D";

/** The frame the module screens are laid out in, and its largest scale (see
 * LevelOneShell) — the header borrows both so its size matches theirs. */
const HEADER_FRAME_W = 390;
const HEADER_FRAME_H = 844;
const HEADER_MAX_SCALE = 1.5;

// 1-indexed position of each question-kind step among *only* the question
// steps, keyed by step id — e.g. `{ career: 1, experience: 2, ... }`. Built
// once at module scope (the step list is static) rather than recomputed on
// every render; drives the header's "question N of QUESTION_COUNT"
// progress bar, which only advances on question screens, not the
// fox-message/notification connector screens between them.
const QUESTION_NUMBER: Record<string, number> = {};
// How many questions come before each step — what the bar shows on the
// dialogue-box screens, which don't advance it themselves.
const QUESTIONS_BEFORE: Record<string, number> = {};
{
  let n = 0;
  for (const step of ONBOARDING_STEPS) {
    QUESTIONS_BEFORE[step.id] = n;
    if (step.kind === "question-list" || step.kind === "question-grid" || step.kind === "time-slider") {
      n += 1;
      QUESTION_NUMBER[step.id] = n;
    }
  }
}

const BOT_HOVER_SRC = "/audios/bot hovering 3.mp3.mpeg";

/** How many questions the progress bar counts ("N of QUESTION_COUNT"). */
const QUESTION_COUNT = Object.keys(QUESTION_NUMBER).length;

/** `?step=` of the sign-up screen; the splash has none. */
const SIGN_UP_STEP = "sign-up";

/** A step's `?step=` name: its id in kebab-case (`pythonLevel` -> `python-level`). */
const stepName = (id: string) => id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The `index` a `?step=` name opens on — the splash when it names no screen. */
function indexOfStep(name: string | undefined): number {
  if (name === SIGN_UP_STEP) return -1;
  const index = ONBOARDING_STEPS.findIndex((step) => stepName(step.id) === name);
  return index >= 0 ? index : -2;
}

/** The `?step=` name of `index` (undefined for the splash). */
function stepNameAt(index: number): string | undefined {
  if (index === -1) return SIGN_UP_STEP;
  const step = ONBOARDING_STEPS[index];
  return step ? stepName(step.id) : undefined;
}

/** Every question opens with nothing selected — including when coming back
 * to it — so its answer is cleared on the way in. The dial starts on its
 * default so "Continue" is live straight away. */
function answersOnArrival(
  answers: OnboardingAnswers,
  step: OnboardingStep | undefined,
): OnboardingAnswers {
  if (step?.kind === "question-list" || step?.kind === "question-grid") {
    return { ...answers, [step.answerKey]: undefined };
  }
  if (step?.kind === "time-slider") {
    return {
      ...answers,
      [step.answerKey]: answers[step.answerKey] ?? String(TIME_SLIDER.initial),
    };
  }
  return answers;
}

// Every screen swap in this flow (splash -> pre-login -> each question) uses
// this same crossfade — `mode="sync"` on the AnimatePresence below lets the
// leaving screen fade out while the entering one fades in at the same time,
// rather than waiting for one to finish before starting the other, which is
// what actually reads as "smooth" instead of a blank flash in between.
const SCREEN_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

interface OnboardingFlowProps {
  /** The screen to open on, by `?step=` name: "sign-up", or a step's id in
   * kebab-case ("career", "python-level"). Anything else opens the splash. */
  initialStep?: string;
  /** Answers from earlier in the session, so screens that quote them (e.g.
   * "good-news") still can when opened directly. */
  initialAnswers?: OnboardingAnswers;
  /** Called with each screen's `?step=` name as it shows (undefined for the
   * splash), so the caller can put it in the URL. */
  onStepChange?: (step: string | undefined) => void;
  /** Called with the answers whenever one changes. */
  onAnswersChange?: (answers: OnboardingAnswers) => void;
  /** Fired after the last question's "Continue" — nothing past this point
   * exists in the reference design yet, so the caller decides what (if
   * anything) comes next. */
  onComplete?: (answers: OnboardingAnswers) => void;
}

/**
 * The full onboarding flow: OnboardingSplash, then PreLoginScreen, then
 * `ONBOARDING_STEPS` in order. `index` of `-2` means the splash, `-1` means
 * PreLoginScreen, `0..ONBOARDING_STEPS.length-1` indexes into the steps
 * array. A plain `useState` index (not routing) — same "one component owns
 * the whole walkthrough" shape instructions-intro's own InstructionsIntroFlow
 * uses; the caller mirrors it in the URL (`onStepChange`) without remounting
 * anything, and can open on any screen (`initialStep`). Going back from
 * PreLoginScreen doesn't return to the splash — same
 * one-shot-entrance reasoning instructions-intro's own RobuSplash uses (see
 * its doc comment): it's Robu's boot-up moment, not a screen to revisit.
 *
 * All three "phases" (splash, pre-login, the current step) render inside one
 * `AnimatePresence` rather than as separate early-returned `<main>`s — that
 * was a plain unmount/mount swap with no transition at all between them.
 */
export function OnboardingFlow({
  initialStep,
  initialAnswers = {},
  onStepChange,
  onAnswersChange,
  onComplete,
}: OnboardingFlowProps) {
  const [startIndex] = useState(() => indexOfStep(initialStep));
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() =>
    answersOnArrival(initialAnswers, ONBOARDING_STEPS[startIndex]),
  );

  // Only a new screen / new answers should report; the callbacks' identity
  // doesn't matter.
  useEffect(() => {
    onStepChange?.(stepNameAt(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    onAnswersChange?.(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);
  const [muted, setMuted] = useState(false);
  // Counts option picks, so the persistent Hex can react to each one.
  const [pickCount, setPickCount] = useState(0);

  // Bumped each time the user comes back to the sign-up screen from a
  // question, so the splash canvas replays its sign-up animations.
  const [signUpReplays, setSignUpReplays] = useState(0);

  // The sign-up buttons wait for the sign-up animation to finish (reported by
  // the splash canvas, which detects it at runtime).
  const [signUpSettled, setSignUpSettled] = useState(false);
  // The step whose voiceover has finished. The CTA stays inactive on a
  // voiced screen until then; goTo clears it so a revisit waits again.
  const [voicedStepId, setVoicedStepId] = useState<string | null>(null);
  // Bumped by the Skip link; the voiced screens watch it.
  const [skipCount, setSkipCount] = useState(0);
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

  // The header is drawn at the same scale as the module screens' (a 390x844
  // frame fitted to the screen), so its buttons are the same size in both.
  const [headerScale, setHeaderScale] = useState(1);
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      const { width, height } = main.getBoundingClientRect();
      setHeaderScale(Math.min(width / HEADER_FRAME_W, height / HEADER_FRAME_H, HEADER_MAX_SCALE));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  // Option/CTA taps play a click (see clickSound) — warmed up once here so
  // the first tap isn't late, and silenced by the header's sound toggle.
  useEffect(preloadClickSound, []);
  useEffect(() => setClickSoundMuted(muted), [muted]);

  // Robu's hover hum plays once while the sign-up screen is showing, and is
  // cut off when the user moves on. Muting follows the header's sound toggle.
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (index !== -1) return;
    const audio = new Audio(encodeURI(BOT_HOVER_SRC));
    audio.muted = muted;
    hoverAudioRef.current = audio;
    // Autoplay can be refused before the user has tapped anything; if so,
    // retry on their first touch/key press.
    // Touch only counts as a user activation on release (pointerup /
    // touchend / click), not on pointerdown, so listen for all of them and
    // keep listening until play() actually succeeds.
    const unlockEvents = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;
    const removeUnlock = () =>
      unlockEvents.forEach((e) => window.removeEventListener(e, retryOnGesture));
    function retryOnGesture() {
      audio
        .play()
        .then(removeUnlock)
        .catch(() => {});
    }
    audio.play().catch(() => {
      unlockEvents.forEach((e) => window.addEventListener(e, retryOnGesture));
    });
    return () => {
      removeUnlock();
      audio.pause();
      hoverAudioRef.current = null;
    };
    // `muted` is applied separately below so toggling it doesn't restart the clip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    if (hoverAudioRef.current) hoverAudioRef.current.muted = muted;
  }, [muted]);

  const goTo = (next: number) => {
    arrivedBackRef.current = next < index;
    // Hide the sign-up buttons right away on the way back, before its
    // animation replays.
    if (next === -1) setSignUpSettled(false);
    setAnswers((prev) => answersOnArrival(prev, ONBOARDING_STEPS[next]));
    setVoicedStepId(null);
    setIndex(next);
  };

  // Leaving any screen with a Hex: he plays his exit first (right going on, left
  // going back), then the flow moves.
  const arrivedBackRef = useRef(false);
  // The entryStyle this screen's Hex enters with; some depend on whether the
  // user arrived via Continue or Back.
  const stepId = index >= 0 ? ONBOARDING_STEPS[index]?.id : undefined;
  const entryStyle = useMemo(() => {
    const style = (stepId ? HEX_ENTRY_STYLE_BY_STEP[stepId] : undefined) ?? HEX_ENTER_STYLE.style;
    if (typeof style === "number") return style;
    return arrivedBackRef.current ? style.back : style.forward;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, index]);
  const [exitRequest, setExitRequest] = useState<HexExitRequest | null>(null);
  const exitingRef = useRef(false);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    exitingRef.current = false;
    setExiting(false);
  }, [index]);
  // The day / night scene's Hex leaves through the bottom either way.
  const exitDirection = (side: "exitLeft" | "exitRight"): HexExitRequest["direction"] =>
    stepId === "learningTime" ? "exitBottom" : side;
  const exitMs = exitRequest?.direction === "exitBottom" ? HEX_EXIT_BOTTOM_MS : HEX_EXIT_MS;
  const afterHexExit = (direction: HexExitRequest["direction"], proceed: () => void) => {
    if (!step) {
      proceed();
      return;
    }
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    setExitRequest((prev) => ({ direction, key: (prev?.key ?? 0) + 1 }));
    window.setTimeout(proceed, direction === "exitBottom" ? HEX_EXIT_BOTTOM_MS : HEX_EXIT_MS);
  };

  const goNext = () => {
    if (index >= ONBOARDING_STEPS.length - 1) {
      onComplete?.(answers);
      return;
    }
    goTo(index + 1);
  };

  // Only the splash's own timer calls this, once; it must not drag the user
  // forward if they have already moved on.
  const showSignUp = () => setIndex((current) => (current === -2 ? -1 : current));

  const goBack = () => {
    afterHexExit(exitDirection("exitLeft"), () => goTo(Math.max(-1, index - 1)));
  };

  const setAnswer = (key: keyof OnboardingAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const step = index >= 0 ? ONBOARDING_STEPS[index] : null;
  // A screen's slot only unregisters once that screen has finished fading
  // out, so the fox would linger over the next screen until then. It follows
  // the current screen instead: no slot for one that doesn't place the fox
  // (the questions have their own Zox), and it's gone that instant.
  // A fox-message screen with a `hexScene` plays its own Hex instead.
  const foxOnScreen =
    (step?.kind === "fox-message" && !step.hexScene) ||
    step?.kind === "streak" ||
    step?.kind === "name-input";
  const isQuestion = step?.kind === "question-list" || step?.kind === "question-grid";
  const questionNumber = step ? QUESTION_NUMBER[step.id] : undefined;
  // Question screens advance the bar; fox-message (dialogue box) screens show
  // it too, held at however many questions have been answered so far.
  // The opening "Hey!" and "Are you ready?" screens have no progress bar yet.
  const noProgress = step?.id === "greeting" || step?.id === "ready-check";
  const progressStep = noProgress
    ? undefined
    : (questionNumber ?? (step?.kind === "fox-message" ? QUESTIONS_BEFORE[step.id] : undefined));
  const progress =
    progressStep !== undefined ? { step: progressStep, total: QUESTION_COUNT } : undefined;

  // The one CTA for the whole flow (see the footer below): its label,
  // enabled state and action follow whichever screen is current.
  const ctaLabel = step ? step.cta : "Get Started";
  const stepVoiceover =
    step && "voiceover" in step ? resolveVoiceover(step.voiceover, answers) : undefined;
  const hasStepVoiceover = !!stepVoiceover?.length;
  const awaitingVoiceover = !!step && hasStepVoiceover && voicedStepId !== step.id;
  // Screens where Hex talks in a speech bubble: while he talks, Skip stands
  // in for the CTA, and the CTA takes its place once the voice is done.
  const onBubbleScreen =
    (step?.kind === "fox-message" && !step.hexScene) || step?.kind === "name-input";
  const showSkip = onBubbleScreen && awaitingVoiceover;
  // `exiting` is left out on purpose: the CTA stays green after a click while
  // Hex leaves (afterHexExit already swallows repeat clicks).
  const ctaDisabled =
    index < -1 ||
    awaitingVoiceover ||
    (step?.kind === "name-input" && !answers.name?.trim()) ||
    ((step?.kind === "question-list" || step?.kind === "question-grid") &&
      !answers[step.answerKey]);
  const requestNotifications = () => {
    if ("Notification" in window) Notification.requestPermission().catch(() => {});
  };
  // On the notification screen the CTA is "Allow Notifications": it asks for
  // the real permission, then moves on ("Don't Allow", below it, just moves on).
  const onNotificationScreen = step?.kind === "notification-permission";
  const handleCta = () => {
    if (onNotificationScreen) requestNotifications();
    afterHexExit(exitDirection("exitRight"), goNext);
  };

  // The CTA fades out on the splash, until the sign-up animation has
  // settled, and while Skip stands in for it — it keeps its space, so the
  // layout doesn't jump as it goes.
  const hideCta = index === -2 || (index === -1 && !signUpSettled) || showSkip;

  // `h-dvh`, not `h-screen`: on mobile, 100vh is the height with the
  // browser's address bar hidden, so whenever the bar is showing the flow ran
  // taller than the visible area and the page scrolled. `dvh` tracks the
  // actually-visible height, so every screen fits on one screen.
  return (
    <FoxStageProvider stage={foxStage} exitRequest={exitRequest} entryStyle={entryStyle}>
      <main
        ref={mainRef}
        className="onboarding-light relative flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-background"
      >
        {/* The animated grid behind every screen but the questions. Screens
          leave their own background transparent so it shows through. It stays
          mounted (just faded out on questions) so its loop never restarts. */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{ opacity: isQuestion || step?.kind === "time-slider" ? 0 : 1 }}
          transition={SCREEN_TRANSITION}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <HexBackground className="h-full w-full" />
        </motion.div>

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
                className="absolute inset-0 flex flex-col"
              >
                {/* Phone-width column, centered on tablets/desktops so options
                  don't stretch across a wide screen. */}
                <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
                  {/* Room for the persistent header drawn above the screens. */}
                  <div aria-hidden className="h-[83px] shrink-0" />

                  {step.kind === "fox-message" && (
                    <FoxMessageScreen
                      className="flex-1"
                      heading={step.heading?.(answers)}
                      headingPlacement={step.headingPlacement}
                      sparkle={step.sparkle}
                      bubble={step.bubble(answers)}
                      greet={step.greet}
                      voiceover={stepVoiceover}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      voiceReadsHeading={step.voiceReadsHeading}
                      voiceReads={step.voiceReads}
                      typeSpeedMs={step.typeSpeedMs}
                      excite={step.excite}
                      hexBeat={step.hexBeat}
                      hexScene={step.hexScene}
                      muted={muted}
                    />
                  )}

                  {step.kind === "notification-permission" && (
                    <NotificationPermissionScreen
                      className="flex-1"
                      heading={step.heading}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      muted={muted}
                    />
                  )}

                  {step.kind === "name-input" && (
                    <NameScreen
                      className="flex-1"
                      prompt={step.prompt}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      muted={muted}
                      value={answers.name ?? ""}
                      onChange={(name) => setAnswer("name", name)}
                      onSubmit={goNext}
                    />
                  )}

                  {step.kind === "time-slider" && (
                    <TimeSliderScreen
                      className="flex-1"
                      heading={step.heading(answers)}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      muted={muted}
                      minutes={Number(answers.timeCommitment ?? TIME_SLIDER.initial)}
                      onChange={(minutes) => setAnswer("timeCommitment", String(minutes))}
                    />
                  )}

                  {step.kind === "streak" && (
                    <StreakScreen
                      className="flex-1"
                      heading={step.heading(answers)}
                      exiting={exiting}
                      exitDelay={0}
                      voiceover={resolveVoiceover(step.voiceover, answers)}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      muted={muted}
                    />
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
                        ? { kind: step.kind, options: step.options, variant: step.variant, roomy: step.roomy }
                        : { kind: step.kind, options: step.options })}
                      selectedId={answers[step.answerKey] ?? null}
                      hexMode={step.hexMode}
                      reactionsArtboard={step.reactionsArtboard}
                      reactionsStateMachine={step.reactionsStateMachine}
                      reactionsScreen={step.reactionsScreen}
                      reactionsOptionOrder={step.kind === "question-grid" ? step.reactionsOptionOrder : undefined}
                      onSelect={(id) => {
                        setAnswer(step.answerKey, id);
                        setPickCount((n) => n + 1);
                      }}
                      voiceover={stepVoiceover}
                      onVoiceoverDone={() => setVoicedStepId(step.id)}
                      skipCount={skipCount}
                      muted={muted}
                      zoxLayout={step.zoxLayout}
                      exiting={exiting}
                      exitDelay={(exitMs - 400) / 1000}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The header lives outside the screen crossfades, so it (and its
            progress bar) is already there when the next screen arrives and
            the bar only moves from the previous step to this one. */}
          {step && (
            <motion.div
              initial={{ opacity: 0 }}
              // On the streak screen the header leaves with Hex's exit.
              animate={{ opacity: exiting && step.kind === "streak" ? 0 : 1 }}
              transition={{ duration: exiting ? 0.4 : 0.2 }}
              // Below Hex (z-[5], see PersistentFox) so his jump passes over the
              // progress bar, not under it; still above the screens (z auto).
              className="pointer-events-none absolute inset-x-0 top-0 z-4"
            >
              <div
                className="pointer-events-auto origin-top-left"
                // Capped at 5xl (1024px) on screen, centred — the box is laid out
                // at 1/scale of its on-screen size, so the cap is divided by it too.
                style={{
                  width: `min(${100 / headerScale}%, ${1024 / headerScale}px)`,
                  marginLeft: "max(0px, calc((100% - 1024px) / 2))",
                  transform: `scale(${headerScale})`,
                }}
              >
                <OnboardingHeader
                  onBack={goBack}
                  progress={progress}
                  muted={muted}
                  onToggleMuted={() => setMuted((m) => !m)}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* The CTA lives here, outside the screen transitions, so it never
          remounts — a per-screen button flickered while its Rive canvas
          reloaded on each crossfade. The slot under it is tall on the
          pre-login screen (it holds the log-in line, which keeps the button
          where it is) and a short bottom padding everywhere else, so the
          button sits near the bottom edge. */}
        <div ref={footerRef} className="relative z-10 shrink-0">
          <div className="mx-auto w-full max-w-[24rem] px-4">
            <div className="relative">
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
              {/* Skip sits over the CTA's (faded-out) box, so the two swap in
                place without the footer changing height. */}
              <AnimatePresence>
                {showSkip && (
                  <motion.div
                    key="skip"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SCREEN_TRANSITION}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSkipCount((n) => n + 1);
                      }}
                      className="pointer-events-auto cursor-pointer px-4 py-3 text-sm font-medium text-[#666666] underline underline-offset-4 sm:text-base dark:text-white/70"
                    >
                      Skip
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <motion.div
              initial={false}
              animate={{ height: onNotificationScreen ? 48 : index <= -1 ? 68 : 8 }}
              transition={SCREEN_TRANSITION}
              className={`flex items-start justify-center ${onNotificationScreen ? "pt-0" : "pt-2"}`}
            >
              <AnimatePresence>
                {index === -1 && signUpSettled && (
                  <motion.p
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SCREEN_TRANSITION}
                    className="text-center text-sm text-[#666666] sm:text-xl"
                  >
                    Already have an account?{" "}
                    {/* No login route exists yet, so this is inert for now. */}
                    <button type="button" className="font-medium text-foreground" aria-disabled>
                      Log in
                    </button>
                  </motion.p>
                )}
                {onNotificationScreen && (
                  <motion.button
                    key="deny"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SCREEN_TRANSITION}
                    onClick={() => {
                      playClickSound();
                      goNext();
                    }}
                    className="px-4 pb-2 pt-0 text-sm font-medium text-[#666666] sm:text-base dark:text-white/70"
                  >
                    Don&apos;t Allow
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <PersistentFox
          containerRef={mainRef}
          slot={foxOnScreen ? foxSlot : null}
          questionKey={isQuestion && step.hexMode === "onboarding" ? step.id : null}
          pickCount={pickCount}
        />

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
            // The theme background (white / #0F1F26) for the splash, then
            // see-through from the sign-up screen on, so the page colour and
            // the grid show behind it.
            className={`relative h-full w-full transition-colors duration-500 ${
              index === -2 ? "bg-background" : "bg-transparent"
            }`}
            bottomInset={footerHeight}
            showSignUpWordmark={index === -1}
            startOnSignUp={startIndex > -2}
            replayKey={signUpReplays}
            onSignUpSettled={setSignUpSettled}
            onComplete={showSignUp}
          />
        </motion.div>
        {/* TEMPORARY dev panel: three taps on Hex open it (see DevPanel). */}
        <DevPanel muted={muted} onToggleMuted={() => setMuted((m) => !m)} onBack={step ? goBack : undefined} />
      </main>
    </FoxStageProvider>
  );
}
