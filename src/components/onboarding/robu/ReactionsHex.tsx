"use client";

import { useCallback, useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  REACTIONS_ARTBOARD,
  REACTIONS_STATE_MACHINE,
  REACTIONS_OPTION,
  REACTIONS_SELECT_TRIGGER,
  HEX_ONBOARDING_TRIGGER,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

// Cover: the artboard is wide (390x171) and this sits in a square slot beside
// the heading, so Hex fills it rather than shrinking to its width.
const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

/**
 * Hex between the question and its options ("superpower level", "Have you
 * worked with code"): the "6.1 and 5.1 2" artboard's `Reactions_SM`. On each
 * pick it sets `option` to the picked option (1-4) and fires `select`.
 */
export function ReactionsHex({
  className,
  artboard = REACTIONS_ARTBOARD,
  stateMachine = REACTIONS_STATE_MACHINE,
  typing,
  selectedOption,
  questionId,
}: {
  className?: string;
  /** Which reactions artboard to play. */
  artboard?: string;
  /** The artboard's state machine. */
  stateMachine?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  /** 1-based index of the picked option, 0 for none. */
  selectedOption: number;
  /** Changes with each question; the state machine returns to its default. */
  questionId: string;
}) {
  const { RiveComponent, ready, fireTrigger, setNumber, reset } = useHexRive(
    LAYOUT,
    stateMachine,
    artboard,
  );

  const react = useCallback(() => {
    if (!selectedOption) return;
    setNumber(REACTIONS_OPTION, selectedOption);
    fireTrigger(REACTIONS_SELECT_TRIGGER);
  }, [selectedOption, setNumber, fireTrigger]);

  // Only picks made while he's showing — never one from before he appeared.
  const lastTyping = useRef(typing);
  useEffect(() => {
    if (!ready || typing === lastTyping.current) return;
    lastTyping.current = typing;
    react();
  }, [ready, typing, react]);

  // The same canvas carries over to the next question, so send the machine
  // back to its entry state rather than leaving the last pick's reaction up.
  // Every new screen (including the first) starts with `idle`, ahead of any
  // other trigger.
  const idledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || idledFor.current === questionId) return;
    if (idledFor.current !== null) reset();
    idledFor.current = questionId;
    fireTrigger(HEX_ONBOARDING_TRIGGER.idle);
  }, [ready, questionId, reset, fireTrigger]);

  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
