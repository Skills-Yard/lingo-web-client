"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import {
  HEX_STATE,
  HEX_ONBOARDING_TRIGGER,
  HEX_TIME_COUNT,
  randomHexTalkTrigger,
  type HexTalkTrigger,
  type HexOnboardingTrigger,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same entrance as ZoxTabFox: fades in and slides up into his spot.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Hex on a question screen, playing the `Onboarding` state machine:
 * `showQuestion` at once on every new `screenId`, then `talk`
 * while the question's voiceover is being read (`speaking`), `showQuestion`
 * once it has been (`questionSpoken` reaches 1 — at once when there's no
 * voice), `selectOption` on every pick (`typing`). `selectOption` does
 * nothing while he's still talking, so a pick before the question is done
 * fires `showQuestion` first. While the options are read out, every new
 * `spokenOption` fires another talk trigger, picked at random (never the
 * previous one), so he keeps talking through them; once the last one has
 * been read he settles back with `showQuestion`. A pick that cuts the voice
 * short — question or options — drops any talk still queued and fires
 * `showQuestion` at once, then `selectOption`. In the career question's pick card he only
 * mounts with the first pick — `reactToMountPick` has that pick count too.
 * On the time-commitment dial, `minutes` sets the view model's `minutes` and
 * then turns `counting` on, so Hex counts out the picked value.
 */
export function OnboardingQuestionHex({
  className,
  typing,
  screenId,
  reactToMountPick = false,
  speaking = false,
  questionSpoken = 1,
  spokenOption = -1,
  restTrigger = HEX_ONBOARDING_TRIGGER.showQuestion,
  minutes,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  /** Changes with every new question. */
  screenId: string;
  /** Treat the `typing` he mounts with as a pick to react to. */
  reactToMountPick?: boolean;
  /** The question's voiceover is playing. */
  speaking?: boolean;
  /** 0..1 — how much of the question has been read; 1 once it has (or with
   * no voice). */
  questionSpoken?: number;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption?: number;
  /** Fired wherever `showQuestion` would be (on arrival, after the voice) —
   * `idle` on the time-commitment dial. */
  restTrigger?: HexOnboardingTrigger;
  /** The time-commitment dial's picked minutes. */
  minutes?: number;
}) {
  const { RiveComponent, ready, fireTrigger, fireNow, reset, setNumber, setBoolean } = useHexRive(
    LAYOUT,
    HEX_STATE.onboarding,
  );

  // Set while the options are being read out.
  const readingOption = useRef<number | null>(null);
  // Declared before the trigger effects below, so the machine is back at idle first.
  useEffect(() => {
    readingOption.current = null;
    if (ready) reset();
  }, [ready, screenId, reset]);

  // `minutes` has to be in place before `counting` flips, so Hex counts to
  // the picked value rather than the previous one.
  useEffect(() => {
    if (!ready || minutes === undefined) return;
    setNumber(HEX_TIME_COUNT.minutes, minutes);
    setBoolean(HEX_TIME_COUNT.counting, true);
  }, [ready, minutes, setNumber, setBoolean]);

  const talkedFor = useRef<string | null>(null);
  const lastTalk = useRef<HexTalkTrigger | null>(null);
  const talk = useCallback(() => {
    lastTalk.current = randomHexTalkTrigger(lastTalk.current);
    fireTrigger(lastTalk.current);
  }, [fireTrigger]);
  const shownFor = useRef<string | null>(null);
  const [mountTyping] = useState(typing);
  const firedFor = useRef(reactToMountPick ? 0 : mountTyping);
  useEffect(() => {
    if (!ready) return;
    const picked = !!typing && firedFor.current !== typing;
    if (shownFor.current !== screenId) {
      const reading = questionSpoken < 1 && !picked;
      if (reading) {
        if (speaking && talkedFor.current !== screenId) {
          talkedFor.current = screenId;
          talk();
        }
        return;
      }
      shownFor.current = screenId;
      if (picked) fireNow(restTrigger);
      else fireTrigger(restTrigger);
    } else if (picked && readingOption.current !== null) {
      fireNow(restTrigger);
    }
    if (!picked) return;
    firedFor.current = typing;
    readingOption.current = null;
    // Queued, so it lands just after `showQuestion`.
    fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption);
  }, [ready, screenId, typing, speaking, questionSpoken, fireTrigger, fireNow, talk, restTrigger]);

  // After the effect above, so each option's talk queues behind `showQuestion`.
  const talkedOption = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (spokenOption < 0) {
      // Read to the end (a pick mid-way is handled above and clears this).
      if (readingOption.current === null) return;
      readingOption.current = null;
      fireTrigger(restTrigger);
      return;
    }
    const key = `${screenId}:${spokenOption}`;
    if (talkedOption.current === key) return;
    talkedOption.current = key;
    readingOption.current = spokenOption;
    talk();
  }, [ready, screenId, spokenOption, talk, fireTrigger, restTrigger]);

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
