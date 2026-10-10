"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { NOTIFY_ASPECT } from "@/lib/rive/runtime";
import { NotifyHex } from "./robu/NotifyHex";

const VIBRATION_DELAY_S = 0.65;
/** Two short pulses — reads as a notification arriving. */
const VIBRATION_PATTERN = [40, 60, 40];

interface NotificationPermissionScreenProps {
  heading: string;
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
  className,
}: NotificationPermissionScreenProps) {
  const reduceMotion = useReducedMotion();

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
      <h1 className="mt-[5dvh] max-w-xs shrink-0 text-center text-xl font-semibold leading-snug text-[#2C2C2C] sm:text-2xl dark:text-white">
        {heading}
      </h1>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <NotifyHex
          className="w-full max-w-[24rem]"
          // Sized by its own aspect, but never taller than the space left.
          style={{ aspectRatio: NOTIFY_ASPECT, maxHeight: "100%" }}
        />
      </div>
    </div>
  );
}
