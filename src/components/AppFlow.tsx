"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import {
  parseOnboardingAnswers,
  readOnboardingAnswersJson,
  saveOnboardingAnswers,
} from "@/lib/onboardingAnswers";
import { onboardingHref } from "@/lib/routes";
import { useHexRiveStatus } from "@/lib/rive/hexFile";

const subscribeNever = () => () => {};

/** Puts the screen in the address bar without navigating — the flow stays
 * mounted, so nothing restarts — and without a history entry: the flow's
 * own Back button moves between screens (with Hex's exit). */
const showStepInUrl = (step: string | undefined) =>
  window.history.replaceState(null, "", onboardingHref(step));

/**
 * The onboarding at `/onboarding`. `?step=` opens it on any screen and
 * follows it as it moves, so a refresh stays put. Answers are kept for the
 * session as they're given, so a screen opened directly still quotes the
 * earlier ones. Finishing it lands on the level page.
 */
export function AppFlow({ initialStep }: { initialStep?: string }) {
  const router = useRouter();
  // Session storage only exists in the browser (server snapshot: null), so
  // the flow renders there only — already holding the saved answers, rather
  // than swapping them in after its first screen has started.
  const savedAnswersJson = useSyncExternalStore(
    subscribeNever,
    readOnboardingAnswersJson,
    () => null,
  );
  // Nothing starts until `hex.riv` is in, so every Hex canvas (and the
  // splash's timer) begins with the file already loaded. A failed preload
  // doesn't block: the canvases fetch the file themselves.
  const hexRiveStatus = useHexRiveStatus();
  if (savedAnswersJson === null || hexRiveStatus === "loading") return null;

  return (
    <OnboardingFlow
      initialStep={initialStep}
      initialAnswers={parseOnboardingAnswers(savedAnswersJson)}
      onStepChange={showStepInUrl}
      onAnswersChange={saveOnboardingAnswers}
      onComplete={() => router.push("/level")}
    />
  );
}
