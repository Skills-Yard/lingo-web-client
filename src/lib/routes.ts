/** `/onboarding?step=` — the onboarding opened on one screen (the names are
 * OnboardingFlow's); no step is the splash. */
export const onboardingHref = (step?: string) =>
  step ? `/onboarding?step=${step}` : "/onboarding";

/** `/module?step=` — one screen of the module (1-based, or `reward` / `complete`). */
export const moduleHref = (step: number | string) => `/module?step=${step}`;

/**
 * A module's screen `step`: `/module/<id>?step=`, or, while a module is being played from its data
 * file (a page under `/kit/play/`), the same screen of that player — so a screen that sends the learner
 * on by itself (a recap) stays in the player.
 */
const screenHref = (id: string, step: number | "complete") => {
  const playing = typeof window !== "undefined" && window.location.pathname.startsWith("/kit/play/");
  return `${playing ? `/kit/play/${id}` : `/module/${id}`}?step=${step}`;
};

/** `/module/sequence?step=` — one screen of the Sequence module (1-based, or `complete`). */
export const sequenceHref = (step: number | "complete") => screenHref("sequence", step);

/** `/module/variable?step=` — one screen of the Variable module (1-based, or `complete`). */
export const variableHref = (step: number | "complete") => screenHref("variable", step);

/** `/module/datatypes?step=` — one screen of the Data Types module (1-based, or `complete`). */
export const datatypesHref = (step: number | "complete") => screenHref("datatypes", step);

/** `/module/operators?step=` — one screen of the Operators module (1-based, or `complete`). */
export const operatorsHref = (step: number | "complete") => screenHref("operators", step);

/** `/module/conditions?step=` — one screen of the Conditions module (1-based, or `complete`). */
export const conditionsHref = (step: number | "complete") => screenHref("conditions", step);

/** `/energy?from=` — the battery's screen; `from` is where its cross returns to. */
export const energyHref = (from: string) => `/energy?from=${encodeURIComponent(from)}`;

/** The `from` of an `/energy` URL's query, if it is a path on this site. */
export const energyReturnPath = (search: string) => {
  const from = new URLSearchParams(search).get("from");
  return from?.startsWith("/") && !from.startsWith("//") ? from : null;
};
