"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TextSpan } from "@/lib/constants/onboarding";
import { QuestionHeading, questionSpoken } from "./QuestionHeading";
import { StreakWidgetHex } from "./robu/StreakWidgetHex";
import { useVoiceover, useVoiceoverGate } from "./useVoiceover";

const CARD_DELAY_S = 0.3;
const CARD_IN = { type: "spring", stiffness: 260, damping: 26 } as const;

interface StreakScreenProps {
  heading: TextSpan[];
  /** Read out as the screen appears; the heading fills in with it. */
  voiceover?: readonly string[];
  /** Called once the voiceover has finished (or failed to play). */
  onVoiceoverDone?: () => void;
  /** Bumped by the Skip link: cuts the voice off. */
  skipCount?: number;
  muted?: boolean;
  className?: string;
  /** The user is leaving: the heading and card float back out. */
  exiting?: boolean;
  /** Seconds to hold them before they leave: when Hex has finished leaving. */
  exitDelay?: number;
}

/**
 * "Keep your coding streak going": the same fox + text row the question
 * screens use (Hex on the `Onboarding` state machine, like the greeting), over
 * Lingo's streak widget (the "HEX_Widget" Rive artboard). The widget rises in
 * once the screen has faded in; if it's taller than the space left above the
 * CTA, its bottom is cropped behind a soft fade instead of shrinking it.
 */
export function StreakScreen({
  heading,
  voiceover,
  onVoiceoverDone,
  skipCount = 0,
  muted = false,
  className,
  exiting = false,
  exitDelay = 0,
}: StreakScreenProps) {
  const reduceMotion = useReducedMotion();
  const voice = useVoiceover(voiceover, true, muted);
  useVoiceoverGate(voice, onVoiceoverDone, skipCount);

  return (
    <div className={`flex min-h-0 flex-col px-4 ${className ?? ""}`}>
      <QuestionHeading
        heading={heading}
        spoken={questionSpoken(voice, !!voiceover?.length)}
        talking={voice.playing}
        screenId="streak"
        foxMode="onboarding"
        leaving={exiting}
        leaveDelay={exitDelay}
      />

      <div className="relative mt-5 min-h-0 flex-1 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/2 w-[min(100%,21rem)] -translate-x-1/2"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
          animate={exiting ? { opacity: 0, y: 90, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={
            exiting
              ? { duration: 0.4, ease: [0.5, 0, 1, 1], delay: exitDelay }
              : { ...CARD_IN, delay: CARD_DELAY_S }
          }
        >
          <StreakWidgetHex className="w-full" />
        </motion.div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-background"
        />
      </div>
    </div>
  );
}
