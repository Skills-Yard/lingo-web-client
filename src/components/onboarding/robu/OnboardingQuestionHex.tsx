"use client";

import { useEffect, useRef, useState } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import { HEX_STATE, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same entrance as ZoxTabFox: fades in and slides up into his spot.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

// `selectOption` only does anything once `showQuestion` has moved the machine
// on, and two triggers fired in the same frame aren't both consumed — so a
// `selectOption` right after `showQuestion` waits a beat.
const SELECT_AFTER_SHOW_MS = 150;

/**
 * Hex on a question screen, playing the `Onboarding` state machine:
 * `showQuestion` as each question (`screenId`) appears, `selectOption` on
 * every pick (`typing`). In the career question's pick card he only mounts
 * with the first pick — `reactToMountPick` has that pick count too.
 */
export function OnboardingQuestionHex({
  className,
  typing,
  screenId,
  reactToMountPick = false,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  /** Changes with every new question. */
  screenId: string;
  /** Treat the `typing` he mounts with as a pick to react to. */
  reactToMountPick?: boolean;
}) {
  const { RiveComponent, ready, fireTrigger } = useHexRive(LAYOUT, HEX_STATE.onboarding);

  const shownFor = useRef<string | null>(null);
  const [mountTyping] = useState(typing);
  const firedFor = useRef(reactToMountPick ? 0 : mountTyping);
  const selectTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(selectTimer.current), []);
  useEffect(() => {
    if (!ready) return;
    let justShown = false;
    if (shownFor.current !== screenId) {
      shownFor.current = screenId;
      justShown = true;
      window.clearTimeout(selectTimer.current);
      fireTrigger(HEX_ONBOARDING_TRIGGER.showQuestion);
    }
    if (!typing || firedFor.current === typing) return;
    firedFor.current = typing;
    window.clearTimeout(selectTimer.current);
    if (!justShown) {
      fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption);
      return;
    }
    selectTimer.current = window.setTimeout(
      () => fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption),
      SELECT_AFTER_SHOW_MS,
    );
  }, [ready, screenId, typing, fireTrigger]);

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
