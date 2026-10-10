"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { saveOnboardingAnswers } from "@/lib/onboardingAnswers";

/** The onboarding at `/`; finishing it lands on the level page. */
export function AppFlow() {
  const router = useRouter();
  return (
    <OnboardingFlow
      onComplete={(answers) => {
        saveOnboardingAnswers(answers);
        router.push("/level");
      }}
    />
  );
}
