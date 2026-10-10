"use client";

import { useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import { HEX_STATE, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same entrance as ZoxTabFox: fades in and slides up into his spot.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

// `selectOption` only does anything once `showQuestion` has moved the machine
// on, and two triggers fired in the same frame aren't both consumed — so the
// first `selectOption` waits a beat after `showQuestion`.
const SELECT_AFTER_SHOW_MS = 150;

/**
 * Hex in an "onboarding" question's pick card (the career tiles): plays the
 * `Onboarding` state machine and fires `selectOption` on every pick —
 * including the one that brought the card up, once his canvas is ready.
 * `showQuestion` fires once first, as the state machine needs it before
 * `selectOption`.
 */
export function OnboardingPickHex({
  className,
  typing,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
}) {
  const { RiveComponent, ready, fireTrigger } = useHexRive(LAYOUT, HEX_STATE.onboarding);

  const shown = useRef(false);
  const firedFor = useRef(0);
  const selectTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(selectTimer.current), []);
  useEffect(() => {
    if (!ready || !typing || firedFor.current === typing) return;
    firedFor.current = typing;
    window.clearTimeout(selectTimer.current);
    if (shown.current) {
      fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption);
      return;
    }
    shown.current = true;
    fireTrigger(HEX_ONBOARDING_TRIGGER.showQuestion);
    selectTimer.current = window.setTimeout(
      () => fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption),
      SELECT_AFTER_SHOW_MS,
    );
  }, [ready, typing, fireTrigger]);

  return (
    <motion.div
      aria-hidden
      className={className}
      initial={{ opacity: 0, y: SLIDE_FROM_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={ENTER}
    >
      <RiveComponent className="h-full w-full" />
    </motion.div>
  );
}
