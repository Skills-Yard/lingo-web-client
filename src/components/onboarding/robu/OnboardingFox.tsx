"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  HEX_STATE,
  HEX_HELLO_MS,
  HEX_TAP_MS,
  HEX_ONBOARDING_TRIGGER,
  type HexState,
} from "@/lib/rive/runtime";
import type { HexOnboardingBeat } from "@/lib/constants/onboarding";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const GREETING_DELAY_MS = 400;

/**
 * Plays "HEX-Happy_Jump" for `HEX_TAP_MS` every time `tapCount` goes up — the
 * stage bumps it on each tap on Hex. Taps while `blocked` (the hello wave) are
 * dropped. Not on mount.
 */
function useTapping(tapCount: number, blocked: boolean) {
  const [tapping, setTapping] = useState(false);
  const lastCount = useRef(tapCount);
  useEffect(() => {
    if (tapCount === lastCount.current) return;
    lastCount.current = tapCount;
    if (blocked) return;
    setTapping(true);
    const timer = window.setTimeout(() => setTapping(false), HEX_TAP_MS);
    return () => window.clearTimeout(timer);
  }, [tapCount, blocked]);
  return tapping;
}

/** True for the hello wave: starts shortly after `greet` turns on, once per greeting. */
function useHello(greet: boolean) {
  const [waving, setWaving] = useState(false);
  useEffect(() => {
    if (!greet) {
      setWaving(false);
      return;
    }
    const start = window.setTimeout(() => setWaving(true), GREETING_DELAY_MS);
    const end = window.setTimeout(() => setWaving(false), GREETING_DELAY_MS + HEX_HELLO_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [greet]);
  return waving;
}

interface OnboardingFoxProps {
  className?: string;
  style?: CSSProperties;
  /** Waves hello shortly after mounting — only the "Hey! I am Zox" greeting
   * screen; every other screen's fox just idles. */
  greet?: boolean;
  /** Bumped on every tap on Hex (cut-scene screens only) — each increase plays
   * the tap jump. */
  tapCount?: number;
  /** The "Are you ready?" excitement. */
  excited?: boolean;
  /** Accepted for callers (FoxSlot), but with no pose for them there's nothing
   * to drive. */
  talking?: boolean;
  laptop?: boolean;
  typing?: number;
  /** Plays the `Onboarding` state machine instead of the poses above, and
   * fires this trigger on it (see `beatKey`). Taps then fire its `tap`. */
  beat?: HexOnboardingBeat | null;
  /** Fires `beat` each time this changes to a new non-null value. */
  beatKey?: string | null;
  /** On an "onboarding" question (Hex hidden): keeps the `Onboarding` state
   * machine running, fires `showQuestion` for each new key and
   * `selectOption` whenever `pickCount` goes up. */
  questionKey?: string | null;
  pickCount?: number;
}

/** `showQuestion` once per new `questionKey`, `selectOption` on each pick. */
function useOnboardingQuestion(
  fireTrigger: (name: string) => void,
  ready: boolean,
  questionKey: string | null,
  pickCount: number,
) {
  const shownKey = useRef<string | null>(null);
  useEffect(() => {
    if (!questionKey) shownKey.current = null;
    if (!ready || !questionKey || shownKey.current === questionKey) return;
    shownKey.current = questionKey;
    fireTrigger(HEX_ONBOARDING_TRIGGER.showQuestion);
  }, [fireTrigger, ready, questionKey]);

  const lastPickCount = useRef(pickCount);
  useEffect(() => {
    if (pickCount === lastPickCount.current) return;
    lastPickCount.current = pickCount;
    if (ready && questionKey) fireTrigger(HEX_ONBOARDING_TRIGGER.selectOption);
  }, [fireTrigger, ready, questionKey, pickCount]);
}

/** Fires `beat` once per new `beatKey`, and the `tap` trigger on every tap. */
function useOnboardingBeat(
  fireTrigger: (name: string) => void,
  ready: boolean,
  beat: HexOnboardingBeat | null,
  beatKey: string | null,
  tapCount: number,
) {
  const firedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !beat || !beatKey || firedKey.current === beatKey) return;
    firedKey.current = beatKey;
    fireTrigger(HEX_ONBOARDING_TRIGGER[beat]);
  }, [fireTrigger, ready, beat, beatKey]);

  const lastTapCount = useRef(tapCount);
  useEffect(() => {
    if (tapCount === lastTapCount.current) return;
    lastTapCount.current = tapCount;
    if (beat) fireTrigger(HEX_ONBOARDING_TRIGGER.tap);
  }, [fireTrigger, beat, tapCount]);
}

/**
 * The onboarding flow's fox: Hex, resting in "HEX-Floating" and switching to
 * the hello wave, the excitement or the tap jump for a moment each. No boot-up
 * of his own — PreLoginScreen and every cut-scene screen just drop him in
 * already idle (the splash plays "HEX-Entry" separately). Screens with a
 * `beat` play the `Onboarding` state machine instead.
 */
export function OnboardingFox({
  className,
  style,
  greet = false,
  excited = false,
  tapCount = 0,
  beat = null,
  beatKey = null,
  questionKey = null,
  pickCount = 0,
}: OnboardingFoxProps) {
  const waving = useHello(greet);
  const tapping = useTapping(tapCount, greet || !!beat);

  let state: HexState = HEX_STATE.idle;
  if (beat || questionKey) state = HEX_STATE.onboarding;
  else if (tapping) state = HEX_STATE.tap;
  else if (waving) state = HEX_STATE.hello;
  else if (excited) state = HEX_STATE.excited;

  const { RiveComponent, ready, fireTrigger } = useHexRive(LAYOUT, state);
  useOnboardingBeat(fireTrigger, ready, beat, beatKey, tapCount);
  useOnboardingQuestion(fireTrigger, ready, questionKey, pickCount);

  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
