import { createAdaptiveFlow } from "@/lib/adaptiveFlow";
import { operatorsHref } from "@/lib/routes";
import { answeredClean, missedStage, struggled } from "./operatorsScore";

/** The Operators module's screens, for its progress bar: the PDF's 40 screens, one step each. */
export const OPERATORS_STEPS = 40;

/** Its place on the level path. */
export const OPERATORS_LEVEL = 5;

/** Whether `step` (the URL's) is one of the module's screens. */
export const isOperatorsStep = (step: string) => step === "complete" || (/^\d+$/.test(step) && Number(step) >= 1 && Number(step) <= OPERATORS_STEPS);

/** Where each screen sits in the module (`/module/operators?step=`): the PDF's screen numbers. */
export const STEP = {
  everyday: 1,
  actions: 2,
  remember: 3,
  remaining: 4,
  meet: 5,
  calcCompare: 6,
  combine: 7,
  chairs: 8,
  sharing: 9,
  unequal: 10,
  three: 11,
  noGroup: 12,
  remainderDrill: 13,
  growing: 14,
  bill: 15,
  order: 16,
  arrange: 17,
  makesSense: 18,
  older: 19,
  trueFalse: 20,
  computerCompares: 21,
  leftToRight: 22,
  readExpression: 23,
  wordsToSymbols: 24,
  sixOperators: 25,
  numberLine: 26,
  atLeast: 27,
  maxLimit: 28,
  answer: 29,
  readEvaluate: 30,
  chooseOperation: 31,
  construct: 32,
  calculator: 33,
  budget: 34,
  wrongBill: 35,
  boundaryBug: 36,
  trip: 37,
  explain: 38,
  toolkit: 39,
  decision: 40,
} as const;

/**
 * What a screen needs for a strong learner to skip it: every screen listed was
 * answered right the first time with no hint. A screen that was itself skipped
 * counts as answered (it was skipped because the ones before it were).
 */
export const SKIPS: Readonly<Record<number, readonly number[]>> = {
  [STEP.trueFalse]: [STEP.older],
  [STEP.readExpression]: [STEP.leftToRight],
  [STEP.wordsToSymbols]: [STEP.leftToRight, STEP.readExpression],
  [STEP.readEvaluate]: [STEP.readExpression, STEP.answer],
  [STEP.chooseOperation]: [STEP.makesSense, STEP.readEvaluate],
};

const cleanRight = (step: number): boolean => answeredClean(step) || (SKIPS[step]?.every(cleanRight) ?? false);

/** "Explain your thinking": trouble with the remainder goes back to the grouping screen, trouble with the comparison to the number line. */
export const explainDetour = () => {
  const remainder = [0, 1, 2].some((stage) => missedStage(STEP.explain, stage));
  if (remainder) return STEP.noGroup;
  const comparison = [4, 5].some((stage) => missedStage(STEP.explain, stage));
  return comparison ? STEP.numberLine : undefined;
};

/** Where a learner who missed (or used the hint on) a screen is sent back to, once: the screen that taught the idea (a function picks it from how the learner did). */
export const DETOURS: Readonly<Record<number, number | (() => number | undefined)>> = {
  [STEP.unequal]: STEP.sharing,
  [STEP.noGroup]: STEP.three,
  [STEP.remainderDrill]: STEP.noGroup,
  [STEP.order]: STEP.bill,
  [STEP.arrange]: STEP.order,
  [STEP.makesSense]: STEP.bill,
  [STEP.trueFalse]: STEP.older,
  [STEP.readExpression]: STEP.leftToRight,
  [STEP.wordsToSymbols]: STEP.leftToRight,
  [STEP.atLeast]: STEP.sixOperators,
  [STEP.maxLimit]: STEP.sixOperators,
  [STEP.readEvaluate]: STEP.answer,
  [STEP.wrongBill]: STEP.bill,
  [STEP.boundaryBug]: STEP.atLeast,
  [STEP.trip]: STEP.noGroup,
  [STEP.explain]: explainDetour,
};

const flow = createAdaptiveFlow({
  steps: OPERATORS_STEPS,
  hrefOf: operatorsHref,
  home: "/level",
  skips: SKIPS,
  detours: DETOURS,
  cleanRight,
  struggled,
  detourKey: "lingo.operators-detour",
  detouredKey: "lingo.operators-detoured",
});

/** Where the main button goes after screen `step`: the next one, a repeat skipped for a strong learner, or back (once) to the screen that taught the idea for one who struggled. */
export const operatorsNext = flow.next;

/** Where the Back arrow goes from screen `step`. */
export const operatorsPrevious = flow.previous;

/** Forgets the pending detour (the module starts over). */
export const resetOperatorsFlow = flow.reset;
