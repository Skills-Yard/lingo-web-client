"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { HEX_STATE, HEX_HELLO_MS, HEX_TAP_MS, type HexState } from "@/lib/rive/runtime";
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
}

/**
 * The onboarding flow's fox: Hex, resting in "HEX-Floating" and switching to
 * the hello wave, the excitement or the tap jump for a moment each. No boot-up
 * of his own — PreLoginScreen and every cut-scene screen just drop him in
 * already idle (the splash plays "HEX-Entry" separately).
 */
export function OnboardingFox({
  className,
  style,
  greet = false,
  excited = false,
  tapCount = 0,
}: OnboardingFoxProps) {
  const waving = useHello(greet);
  const tapping = useTapping(tapCount, greet);

  let state: HexState = HEX_STATE.idle;
  if (tapping) state = HEX_STATE.tap;
  else if (waving) state = HEX_STATE.hello;
  else if (excited) state = HEX_STATE.excited;

  const { RiveComponent } = useHexRive(LAYOUT, state);

  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
