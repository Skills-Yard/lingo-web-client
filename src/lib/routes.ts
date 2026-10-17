/** `/onboarding?step=` — the onboarding opened on one screen (the names are
 * OnboardingFlow's); no step is the splash. */
export const onboardingHref = (step?: string) =>
  step ? `/onboarding?step=${step}` : "/onboarding";

/** `/module?level=&step=` — one screen of a level, both 1-based. */
export const moduleHref = (level: number, step: number) =>
  `/module?level=${level}&step=${step}`;
