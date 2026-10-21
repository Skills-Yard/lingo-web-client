"use client";

import { HexBleed, HEX_BLEED } from "./HexBleed";
import { useCallback, useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  REACTIONS_ARTBOARD,
  REACTIONS_STATE_MACHINE,
  REACTIONS_OPTION,
  REACTIONS_SCREEN,
  REACTIONS_SELECT_TRIGGER,
  HEX_ONBOARDING_TRIGGER,
  randomHexTalkTrigger,
  type HexTalkTrigger,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";
import { useHexExit } from "./hexExit";

// Cover: the artboard is wide (390x171) and this sits in a square slot beside
// the heading, so Hex fills it rather than shrinking to its width.
const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

/**
 * Hex between the question and its options ("superpower level", "Have you
 * worked with code"): the "6.1 and 5.1 2" artboard's `Reactions_SM`. On each
 * pick it sets `option` to the picked option (1-4) and fires `select`.
 *
 * While the voiceover reads the question (`speaking`) he talks — a random
 * `talk`/`talk2`/`talk3` — and again for each option as it is read
 * (`spokenOption`, never repeating the last). Once the question or the last
 * option has been read he returns to `idle`; a pick mid-voice does the same
 * at once, ahead of `select`. useHexRive puts a `stopTalk` ahead of any
 * non-talk trigger that follows a talk, so each of those ends the talk first.
 */
export function ReactionsHex({
  className,
  artboard = REACTIONS_ARTBOARD,
  stateMachine = REACTIONS_STATE_MACHINE,
  screen,
  typing,
  selectedOption,
  questionId,
  speaking = false,
  questionSpoken = 1,
  spokenOption = -1,
}: {
  className?: string;
  /** Which reactions artboard to play. */
  artboard?: string;
  /** The artboard's state machine. */
  stateMachine?: string;
  /** Value of the artboard's `screen` number for this question. */
  screen?: number;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  /** 1-based index of the picked option, 0 for none. */
  selectedOption: number;
  /** Changes with each question; the state machine returns to its default. */
  questionId: string;
  /** The question's voiceover is playing. */
  speaking?: boolean;
  /** 0..1 — how much of the question has been read; 1 once it has (or with
   * no voice). */
  questionSpoken?: number;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption?: number;
}) {
  const { RiveComponent, ready, fireTrigger, fireNow, setNumber, reset } = useHexRive(
    LAYOUT,
    stateMachine,
    artboard,
    undefined,
    questionId,
    null,
    undefined,
    HEX_BLEED,
  );
  useHexExit(fireTrigger, ready);

  // True from a talk trigger until the idle that ends it.
  const talking = useRef(false);
  const lastTalk = useRef<HexTalkTrigger | null>(null);
  const talk = useCallback(() => {
    lastTalk.current = randomHexTalkTrigger(lastTalk.current);
    talking.current = true;
    fireTrigger(lastTalk.current);
  }, [fireTrigger]);

  const react = useCallback(() => {
    if (!selectedOption) return;
    // A pick cuts any talk short: idle (behind its stopTalk) goes first.
    if (talking.current) {
      talking.current = false;
      fireNow(HEX_ONBOARDING_TRIGGER.idle);
    }
    if (screen !== undefined) setNumber(REACTIONS_SCREEN, screen);
    setNumber(REACTIONS_OPTION, selectedOption);
    fireTrigger(REACTIONS_SELECT_TRIGGER);
  }, [screen, selectedOption, setNumber, fireTrigger, fireNow]);

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
    talking.current = false;
    idledFor.current = questionId;
    if (screen !== undefined) setNumber(REACTIONS_SCREEN, screen);
    fireTrigger(HEX_ONBOARDING_TRIGGER.idle);
  }, [ready, questionId, screen, reset, setNumber, fireTrigger]);

  // After the idle effect, so a question's talk queues behind its `idle`.
  const talkedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || idledFor.current !== questionId) return;
    if (speaking && questionSpoken < 1 && talkedFor.current !== questionId) {
      talkedFor.current = questionId;
      talk();
    }
  }, [ready, questionId, speaking, questionSpoken, talk]);

  const talkedOption = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || idledFor.current !== questionId) return;
    if (spokenOption < 0) return;
    const key = `${questionId}:${spokenOption}`;
    if (talkedOption.current === key) return;
    talkedOption.current = key;
    talk();
  }, [ready, questionId, spokenOption, talk]);

  // Back to idle once the question — or the last option — has been read.
  useEffect(() => {
    if (!ready || !talking.current) return;
    if (questionSpoken < 1 || spokenOption >= 0) return;
    talking.current = false;
    fireTrigger(HEX_ONBOARDING_TRIGGER.idle);
  }, [ready, questionSpoken, spokenOption, fireTrigger]);

  return (
    <div aria-hidden className={className}>
      <HexBleed Canvas={RiveComponent} />
    </div>
  );
}
