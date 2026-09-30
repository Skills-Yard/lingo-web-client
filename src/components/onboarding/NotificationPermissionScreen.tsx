"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NotificationFox } from "./robu/NotificationFox";
import { FoxSlot } from "./foxStage";

// Choreography, in order: the screen crossfades in (OnboardingFlow's
// SCREEN_TRANSITION) while the flow's fox glides from the previous screen's
// spot to the center and fades out there (a hidden FoxSlot), the prompt
// springs open from the center — with a short buzz as it lands — and then
// this screen's own fox rises up from behind it to peek over the top,
// carrying on with its "notification" animation from there. Leaving, it
// sinks back down first, then the flow's fox reappears at the center and
// glides on to the next screen's spot.
const PROMPT_DELAY_S = 0.35;
const PROMPT_IN = { type: "spring", stiffness: 380, damping: 24 } as const;
const FOX_DELAY_S = 0.75;
const FOX_IN = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;
const FOX_OUT = { duration: 0.3, ease: [0.4, 0, 1, 1] } as const;
/** Two short pulses — reads as a notification arriving. */
const VIBRATION_PATTERN = [40, 60, 40];

interface NotificationPermissionScreenProps {
  heading: string;
  /** "Allow" on the prompt — the caller asks for the real permission. */
  onAllow: () => void;
  /** "Don't Allow" on the prompt. */
  onDeny: () => void;
  className?: string;
}

/**
 * The notification-priming screen: the fox peeking up over a
 * notification-permission prompt. The prompt is the app's own card, not the
 * browser's (a real system prompt looks however the OS draws it), so it
 * only sets expectations — "Allow" goes on to fire the actual
 * `Notification.requestPermission()` prompt (see OnboardingFlow), "Don't
 * Allow" just moves on. It's the only way forward: the flow's footer CTA
 * is hidden on this screen.
 */
export function NotificationPermissionScreen({
  heading,
  onAllow,
  onDeny,
  className,
}: NotificationPermissionScreenProps) {
  const reduceMotion = useReducedMotion();

  // Buzz as the prompt lands. Android browsers support this; iOS Safari has
  // no Vibration API, so it's a silent no-op there.
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(VIBRATION_PATTERN);
        }
      },
      reduceMotion ? 0 : PROMPT_DELAY_S * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className={`flex flex-col items-center px-6 ${className ?? ""}`}>
      <h1 className="mt-[5dvh] max-w-xs shrink-0 text-center text-xl font-semibold leading-snug text-[#2C2C2C] sm:text-2xl dark:text-white">
        {heading}
      </h1>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="relative w-full max-w-[17.5rem]">
          {/* Where the flow's fox glides to and hands over — see above. */}
          <FoxSlot
            hidden
            laptop
            className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2"
          />

          {/* Peeking over the prompt's top-right corner. The rig's
              "notification" pose keeps the fox (head + paws) in the bottom
              half of its frame with the paws on the frame's bottom edge, so
              the frame sits just above the prompt's top edge — close enough
              that the paws rest on the edge. It rises up from behind the
              prompt as it appears. */}
          <motion.div
            className="absolute right-0 bottom-[calc(100%-0.125rem)] aspect-square h-[min(10rem,22dvh)]"
            initial={reduceMotion ? false : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0, transition: { ...FOX_IN, delay: FOX_DELAY_S } }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 48, transition: FOX_OUT }}
          >
            <NotificationFox className="h-full w-full" />
          </motion.div>

          <motion.div
            role="dialog"
            aria-label="Notification"
            className="relative overflow-hidden rounded-[14px] bg-[#E9E9E9] text-center shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:bg-[#2C2C2E] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...PROMPT_IN, delay: PROMPT_DELAY_S }}
          >
            <div className="px-5 pt-4 pb-4">
              <p className="text-[15px] font-semibold text-[#1A1C22] dark:text-white">Notification</p>
              <p className="mt-1.5 text-[13px] leading-snug text-[#3C3C43] dark:text-white/70">
                &ldquo;Lingo&rdquo; would like to send
                <br />
                you notifications
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-black/10 border-t border-black/10 dark:divide-white/15 dark:border-white/15 text-[15px]">
              <button
                type="button"
                onClick={onDeny}
                className="py-3 text-[#8E8E93] transition-colors active:bg-black/5 dark:active:bg-white/10"
              >
                Don&apos;t Allow
              </button>
              <button
                type="button"
                onClick={onAllow}
                className="py-3 font-medium text-[#1C8CE6] transition-colors active:bg-black/5 dark:text-[#3AA0FF] dark:active:bg-white/10"
              >
                Allow
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
