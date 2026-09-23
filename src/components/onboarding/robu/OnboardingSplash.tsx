"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import { Sekuya } from "next/font/google";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Sekuya only ships one weight (400) — still passed explicitly since
// next/font requires it for any non-variable Google font. Same face as
// PreLoginScreen's own "LINGO" wordmark, just white-on-green here instead of
// green-on-white.
const sekuya = Sekuya({ subsets: ["latin"], weight: "400" });

const ARTBOARD = "Artboard 2";

// A second, separate state machine from "State Machine 1" (see
// ROBU_RIVE_SRC's own doc comment) — a close-up, zoomed-in boot reveal that
// drives its own internal automatic (no-input) transition chain and settles
// into its own "idle" state, staying at that same zoomed framing rather than
// resetting to the normal full-body pose. That's why this stays its own
// disposable canvas rather than something OnboardingFox's persistent
// instance plays and hands off from — handing off only stops the timeline,
// it doesn't reset whatever root transform the state machine left behind
// (confirmed against instructions-intro's own RobuSplash, which this
// mirrors — see its doc comment for the fuller story).
const SPLASH_STATE_MACHINE = "splash screen";

// No "done" event to wait on (state machines don't expose one the way a
// single linear animation's Stop event does), so this is a plain timer
// standing in for one: how long the boot sequence takes to settle into its
// own held idle look, measured against the actual timeline lengths in the
// .riv.
const SPLASH_SETTLE_MS = 3200;

// Cover (not Contain): the artwork stretches to fill the box's full width —
// cropping top/bottom as needed, bottom-aligned — so it reads as attached to
// both side edges instead of floating with empty margin on either side.
const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.BottomCenter });

// The wordmark's own entrance — quick, since it only has to read before
// Robu's own boot-up sequence gets going underneath it, not span the whole
// splash.
const TEXT_INTRO = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

interface OnboardingSplashProps {
  className?: string;
  /** Fired once the splash sequence has had its moment on screen — the
   * caller unmounts this component in response (OnboardingFlow swaps it for
   * PreLoginScreen), it never hides itself. */
  onComplete: () => void;
}

/**
 * The onboarding flow's very first screen: the branded launch splash (solid
 * `#01A17F` background, blurred glow, "LINGO" wordmark) with Robu's own
 * animated "splash screen" state machine bottom-attached in front of it.
 */
export function OnboardingSplash({ className, onComplete }: OnboardingSplashProps) {
  const { RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    stateMachines: SPLASH_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

  useEffect(() => {
    const timer = window.setTimeout(onComplete, SPLASH_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`overflow-hidden bg-[#01A17F] ${className ?? ""}`}>
      {/* Soft ambient glow behind Robu, echoing the reference design's
          blurred "Ellipse 42" — bleeds past both side edges and the bottom
          so its own blur radius never shows a hard edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[90%] w-[140%] -translate-x-1/2 blur-[70px]"
        style={{
          background:
            "linear-gradient(180deg, #01A17F 14.56%, #005731 58.51%)",
        }}
      />

      {/* "LINGO" wordmark — Sekuya is an all-caps-only display face, so the
          literal string is uppercase to match rather than relying on
          text-transform to fake it. Animates in on mount (fade + rise +
          scale) rather than just appearing, matching Robu's own boot-up
          motion underneath it instead of sitting static above it. */}
      <motion.h1
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={TEXT_INTRO}
        className={`${sekuya.className} relative z-10 pt-[24vh] text-center text-5xl text-white sm:pt-[22vh] sm:text-6xl md:pt-[20vh] md:text-7xl`}
      >
        LINGO
      </motion.h1>

      <div className="absolute inset-x-0 bottom-0 z-10 h-[45vh] sm:h-[50vh] md:h-[55vh]">
        <RiveComponent className="h-full w-full" />
      </div>
    </div>
  );
}
