import { createAdaptiveFlow } from "@/lib/adaptiveFlow";
import { conditionsHref } from "@/lib/routes";
import { answeredClean, struggled } from "./conditionsScore";

/** The Conditions module's screens, for its progress bar: the PDF's 38 screens, one step each. */
export const CONDITIONS_STEPS = 38;

/** Its place on the level path. */
export const CONDITIONS_LEVEL = 6;

/** Whether `step` (the URL's) is one of the module's screens. */
export const isConditionsStep = (step: string) => step === "complete" || (/^\d+$/.test(step) && Number(step) >= 1 && Number(step) <= CONDITIONS_STEPS);

/** Where each screen sits in the module (`/module/conditions?step=`): the PDF's screen numbers. */
export const STEP = {
  why: 1,
  whatIs: 2,
  trueFalse: 3,
  infoVsCondition: 4,
  construct: 5,
  positiveMeaning: 6,
  positiveCondition: 7,
  negative: 8,
  equal: 9,
  notEqual: 10,
  atLeast: 11,
  atMost: 12,
  evenIdea: 13,
  remainder: 14,
  odd: 15,
  challenge: 16,
  twoRequirements: 17,
  andTable: 18,
  orClass: 19,
  orTable: 20,
  andVsOr: 21,
  range: 22,
  inclusive: 23,
  firstIncluded: 24,
  bothExcluded: 25,
  outside: 26,
  reverse: 27,
  notPython: 28,
  notComparison: 29,
  marksAttendance: 30,
  alternatives: 31,
  groups: 32,
  workshop: 33,
  boundaryBug: 34,
  andOrBug: 35,
  designer: 36,
  toolkit: 37,
  next: 38,
} as const;

/**
 * What a screen needs for a strong learner to skip it: every screen listed was
 * answered right the first time with no hint. A screen that was itself skipped
 * counts as answered (it was skipped because the ones before it were).
 */
const SKIPS: Readonly<Record<number, readonly number[]>> = {
  [STEP.negative]: [STEP.positiveCondition],
  [STEP.notEqual]: [STEP.equal],
  [STEP.atMost]: [STEP.atLeast],
  [STEP.odd]: [STEP.remainder],
  [STEP.andVsOr]: [STEP.andTable, STEP.orTable],
  [STEP.bothExcluded]: [STEP.firstIncluded],
  [STEP.notComparison]: [STEP.notPython],
  [STEP.andOrBug]: [STEP.boundaryBug],
};

const cleanRight = (step: number): boolean => answeredClean(step) || (SKIPS[step]?.every(cleanRight) ?? false);

const flow = createAdaptiveFlow({
  steps: CONDITIONS_STEPS,
  hrefOf: conditionsHref,
  home: "/level",
  skips: SKIPS,
  // No detours: a wrong answer only repeats that screen (its "Try again"), never an earlier one.
  detours: {},
  cleanRight,
  struggled,
  detourKey: "lingo.conditions-detour",
  detouredKey: "lingo.conditions-detoured",
});

/** Where the main button goes after screen `step`: the next one, or the one after it when a repeat is skipped for a strong learner. */
export const conditionsNext = flow.next;

/** Where the Back arrow goes from screen `step`. */
export const conditionsPrevious = flow.previous;

/** Forgets the pending detour (the module starts over). */
export const resetConditionsFlow = flow.reset;
