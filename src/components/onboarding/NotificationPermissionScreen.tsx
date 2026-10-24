"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { NOTIFY_ASPECT } from "@/lib/rive/runtime";
import { NotifyHex } from "./robu/NotifyHex";
import { ONBOARDING_QUESTION_CLASS } from "./headingStyle";
import { KaraokeSpans, questionSpoken } from "./QuestionHeading";
import { useVoiceover, useVoiceoverGate } from "./useVoiceover";

const VIBRATION_DELAY_S = 0.65;
/** Two short pulses — reads as a notification arriving. */
const VIBRATION_PATTERN = [40, 60, 40];

interface NotificationPermissionScreenProps {
  heading: string;
  /** Read out as the screen appears; the heading fills in with it. */
  voiceover?: readonly string[];
  /** Called once the voiceover has finished (or failed to play). */
  onVoiceoverDone?: () => void;
  /** Bumped by the Skip link: cuts the voice off. */
  skipCount?: number;
  muted?: boolean;
  className?: string;
}

/**
 * The notification-priming screen: Hex and the permission popup are one Rive
 * artboard (NotifyHex), whose own buttons can't be pressed — "Allow
 * Notifications" and "Don't Allow" are the flow's footer (see
 * OnboardingFlow), right below it. The popup is the app's own card, not the
 * browser's, so it only sets expectations; "Allow Notifications" goes on to
 * fire the actual `Notification.requestPermission()` prompt.
 */
export function NotificationPermissionScreen({
  heading,
  voiceover,
  onVoiceoverDone,
  skipCount = 0,
  muted = false,
  className,
}: NotificationPermissionScreenProps) {
  const reduceMotion = useReducedMotion();
  const voice = useVoiceover(voiceover, true, muted);
  useVoiceoverGate(voice, onVoiceoverDone, skipCount);
  const spoken = questionSpoken(voice, !!voiceover?.length);

  // Buzz as the popup lands. Android browsers support this; iOS Safari has
  // no Vibration API, so it's a silent no-op there.
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(VIBRATION_PATTERN);
        }
      },
      reduceMotion ? 0 : VIBRATION_DELAY_S * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className={`flex flex-col items-center px-6 ${className ?? ""}`}>
      {/* Same box as the question rows' fox slot, so the heading sits at the
          same height as on the other question screens. */}
      <div className="flex shrink-0 items-center max-sm:h-[7.25rem] max-sm:pt-[9px] sm:h-[7rem]">
        <h1 className={`max-w-[min(20rem,calc(100vw-3rem))] -translate-y-12 text-center ${ONBOARDING_QUESTION_CLASS}`}>
          <KaraokeSpans spans={[{ text: heading }]} spoken={spoken} />
        </h1>
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <NotifyHex
          className="w-full max-w-[24rem] -translate-y-24"
          // Sized by its own aspect, but never taller than the space left.
          style={{ aspectRatio: NOTIFY_ASPECT, maxHeight: "100%" }}
        />
      </div>
    </div>
  );
}
