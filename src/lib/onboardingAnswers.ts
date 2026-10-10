import type { OnboardingAnswers } from "@/lib/constants/onboarding";

const KEY = "lingo:onboarding-answers";

/** Hands the finished onboarding's answers to the pages after it (they are
 * separate routes now). Session-scoped: it only has to survive the redirect
 * and a refresh, and storage can be unavailable (private mode), so every
 * access is guarded. */
export function saveOnboardingAnswers(answers: OnboardingAnswers): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Pages fall back to "Not set" / "Learner".
  }
}

/** The stored answers as raw JSON ("" when none/unavailable) — a primitive,
 * so it can serve as a stable `useSyncExternalStore` snapshot. */
export function readOnboardingAnswersJson(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseOnboardingAnswers(json: string): OnboardingAnswers {
  try {
    return json ? (JSON.parse(json) as OnboardingAnswers) : {};
  } catch {
    return {};
  }
}
