"use client";

import { useCallback, useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  REACTIONS_ARTBOARD,
  REACTIONS_STATE_MACHINE,
  REACTIONS_OPTION,
  REACTIONS_SELECT_TRIGGER,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/**
 * Hex between the question and its options ("superpower level", "Have you
 * worked with code"): the "6.1 and 5.1" artboard's `Reactions_SM`. On each
 * pick it sets `option` to the picked option (1-4) and fires `select`.
 */
export function ReactionsHex({
  className,
  typing,
  selectedOption,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  /** 1-based index of the picked option, 0 for none. */
  selectedOption: number;
}) {
  const { RiveComponent, ready, fireTrigger, setNumber } = useHexRive(
    LAYOUT,
    REACTIONS_STATE_MACHINE,
    REACTIONS_ARTBOARD,
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

  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
