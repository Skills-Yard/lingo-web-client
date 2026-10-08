"use client";

import { useEffect, useRef, useState } from "react";
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceTrigger,
} from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { AnimatePresence, motion } from "framer-motion";
import { Sekuya } from "next/font/google";
import {
  configureRiveRuntime,
  SPLASH_RIVE_SRC,
  SPLASH_ARTBOARD,
  SPLASH_STATE_MACHINE,
  SPLASH_VIEW_MODEL,
  SPLASH_SHOW_SIGNUP_TRIGGER,
} from "@/lib/rive/runtime";

// Sekuya only ships one weight (400) — passed explicitly since next/font
// requires it for any non-variable Google font.
const sekuya = Sekuya({ subsets: ["latin"], weight: "400" });

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// How long the splash sequence runs before the sign-up screen is triggered.
const SPLASH_DURATION_MS = 2500;

// Length of the sign-up animation: the buttons show this long after the
// sign-up trigger fires.
const SIGNUP_ANIMATION_MS = 5500;

// Full width, centred on the screen. If that would run into the footer button,
// the artboard instead fits (whole) in the space above the footer.
const LAYOUT_FIT_WIDTH = new Layout({ fit: Fit.FitWidth, alignment: Alignment.Center });
const LAYOUT_ABOVE_FOOTER = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface OnboardingSplashProps {
  className?: string;
  /** Space (px) kept clear at the bottom for the footer CTA — the artboard
   * fits entirely in what's left above it. */
  bottomInset?: number;
  /** Shows the "LINGO" wordmark at the bottom of the screen (splash only). */
  showWordmark?: boolean;
  /** Changing this (after mount) replays the sign-up animations — used when
   * the user navigates back to the sign-up screen. */
  replayKey?: number;
  /** Reports whether the sign-up animation has finished: `false` the moment
   * the trigger fires, `true` once the state machine settles. */
  onSignUpSettled?: (settled: boolean) => void;
  /** Fired once the splash has run its course and the sign-up trigger has
   * been sent — the caller unmounts this component in response
   * (OnboardingFlow swaps it for PreLoginScreen), it never hides itself. */
  onComplete: () => void;
}

/**
 * The onboarding flow's very first screen: the full-screen Rive splash
 * (`Splash_SM`, data-bound to `Splash_VM`). After `SPLASH_DURATION_MS` it
 * fires the view model's `showSignUpScreen` trigger and hands over to the
 * sign-up screen.
 */
export function OnboardingSplash({ className, bottomInset = 0, showWordmark = false, replayKey = 0, onSignUpSettled, onComplete }: OnboardingSplashProps) {
  const { rive, RiveComponent } = useRive({
    src: SPLASH_RIVE_SRC,
    artboard: SPLASH_ARTBOARD,
    stateMachines: SPLASH_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT_FIT_WIDTH,
  });

  // The artboard is centred on the full screen; it only gives up the footer's
  // space when its (full-width) height would overlap the button.
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: container.offsetWidth, height: container.offsetHeight }),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const bounds = rive?.bounds;
  const aspect = bounds ? (bounds.maxY - bounds.minY) / (bounds.maxX - bounds.minX) : 0;
  const overlapsFooter = size.width * aspect > size.height - 2 * bottomInset;
  const inset = overlapsFooter ? bottomInset : 0;

  useEffect(() => {
    if (!rive) return;
    rive.layout = overlapsFooter ? LAYOUT_ABOVE_FOOTER : LAYOUT_FIT_WIDTH;
  }, [rive, overlapsFooter]);

  const viewModel = useViewModel(rive, { name: SPLASH_VIEW_MODEL });
  const viewModelInstance = useViewModelInstance(viewModel, { rive });
  const { trigger: showSignUpScreen } = useViewModelInstanceTrigger(
    SPLASH_SHOW_SIGNUP_TRIGGER,
    viewModelInstance,
  );

  // Latest-ref so the one-shot timer below never restarts when the trigger
  // function or callback identity changes.
  const showSignUpScreenRef = useRef(showSignUpScreen);
  showSignUpScreenRef.current = showSignUpScreen;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onSignUpSettledRef = useRef(onSignUpSettled);
  onSignUpSettledRef.current = onSignUpSettled;

  // Fires the sign-up trigger and reports when its animation has finished.
  const settleTimerRef = useRef<number | undefined>(undefined);
  const fireSignUp = () => {
    onSignUpSettledRef.current?.(false);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(
      () => onSignUpSettledRef.current?.(true),
      SIGNUP_ANIMATION_MS,
    );
    showSignUpScreenRef.current?.();
  };
  const fireSignUpRef = useRef(fireSignUp);
  fireSignUpRef.current = fireSignUp;
  useEffect(() => () => window.clearTimeout(settleTimerRef.current), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fireSignUpRef.current();
      onCompleteRef.current();
    }, SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Back on the sign-up screen: fire the trigger again on the artboard as it
  // was left (no restart), so what plays after the trigger plays once more.
  useEffect(() => {
    if (replayKey === 0) return;
    fireSignUpRef.current();
  }, [replayKey]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className ?? ""}`}>
      <div className="absolute inset-x-0 top-0" style={{ bottom: inset }}>
        <RiveComponent className="h-full w-full" />
      </div>

      <AnimatePresence>
        {showWordmark && (
          <motion.h1
            key="wordmark"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`${sekuya.className} pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-5xl text-white sm:text-6xl`}
          >
            LINGO
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
}
