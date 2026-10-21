"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";

export type HexExitRequest = {
  direction: "exitLeft" | "exitRight" | "exitBottom";
  /** Changes with every request, so the same direction can fire twice. */
  key: number;
};

/** Set by OnboardingFlow when the user leaves a screen; every Hex on screen reacts. */
export const HexExitContext = createContext<HexExitRequest | null>(null);

/** The `entryStyle` the current screen's Hex enters with (see `HEX_ENTRY_STYLE_BY_STEP`). */
export const HexEntryStyleContext = createContext<number | null>(null);

/** Fires the current exit trigger once per new request. A Hex whose view model
 * has no such trigger ignores it. */
export function useHexExit(fireTrigger: (name: string) => void, ready: boolean) {
  const request = useContext(HexExitContext);
  // Starts at the request already in force: a Hex mounting on the next screen
  // must not replay the exit that took the user there.
  const firedKey = useRef<number | null>(request?.key ?? null);
  useEffect(() => {
    if (!ready || !request || firedKey.current === request.key) return;
    firedKey.current = request.key;
    fireTrigger(HEX_ONBOARDING_TRIGGER[request.direction]);
  }, [fireTrigger, ready, request]);
}
