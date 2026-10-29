/** `/onboarding?step=` — the onboarding opened on one screen (the names are
 * OnboardingFlow's); no step is the splash. */
export const onboardingHref = (step?: string) =>
  step ? `/onboarding?step=${step}` : "/onboarding";

/** `/module?step=` — one screen of the module (1-based, or `reward` / `complete`). */
export const moduleHref = (step: number | string) => `/module?step=${step}`;

/** `/energy?from=` — the battery's screen; `from` is where its cross returns to. */
export const energyHref = (from: string) => `/energy?from=${encodeURIComponent(from)}`;

/** The `from` of an `/energy` URL's query, if it is a path on this site. */
export const energyReturnPath = (search: string) => {
  const from = new URLSearchParams(search).get("from");
  return from?.startsWith("/") && !from.startsWith("//") ? from : null;
};
