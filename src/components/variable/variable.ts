import { variableHref } from "@/lib/routes";
import type { SceneName } from "@/lib/rive/variableHost";
import { cleanRight, DETOURED_KEY, DETOUR_KEY, struggled } from "./variableScore";

/** The Variable module's screens, for its progress bar. */
export const VARIABLE_STEPS = 34;

/** Its place on the level path. */
export const VARIABLE_LEVEL = 3;

/** Whether `step` (the URL's) is one of the module's screens. */
export const isVariableStep = (step: string) => step === "complete" || (/^\d+$/.test(step) && Number(step) >= 1 && Number(step) <= VARIABLE_STEPS);

/** Where each screen sits in the module (`/module/variable?step=`); the PDF's screens 1-29, then its four questions, then the last one. */
export const STEP = {
  trek: 1,
  thirsty: 2,
  noWater: 3,
  carry: 4,
  bottle: 5,
  bridge: 6,
  fill: 7,
  addWater: 8,
  sameBottle: 9,
  drink: 10,
  empty: 11,
  labels: 12,
  meet: 13,
  classify: 14,
  attendance: 15,
  names: 16,
  tomorrow: 17,
  shopping: 18,
  prices: 19,
  total: 20,
  eraser: 21,
  pocket: 22,
  received: 23,
  spent: 24,
  follow: 25,
  appIntro: 26,
  plan: 27,
  debug: 28,
  travel: 29,
  reflectWhy: 30,
  reflectChange: 31,
  reflectNames: 32,
  reflectBoth: 33,
  recap: 34,
} as const;

/** The screens where the bottle is filled and drunk from: its scene is their backdrop. */
const BOTTLE_STEPS: readonly number[] = [STEP.bottle, STEP.fill, STEP.addWater, STEP.drink, STEP.empty, STEP.meet];

/** The screens about the notebook, pen and eraser (the shop counter), and about the pocket money (the wallet). */
const SHOP_STEPS: readonly number[] = [STEP.shopping, STEP.prices, STEP.total, STEP.eraser, STEP.debug];
const WALLET_STEPS: readonly number[] = [STEP.pocket, STEP.received, STEP.spent, STEP.follow];

/**
 * The scene behind a screen: the four objects on "Pick the Right Object", the bottle, the
 * labelled bottles on "Which bottle is mine?" and "Why Meaningful Names?", the pair of variable cards on "Same Bottle, New
 * Amount" and on "Name or Value?" (both its stages), the classroom on "A New Day at School!" and "Three
 * Pieces of Data" (both its stages), the shop, the wallet, and the trail on every other.
 */
export const sceneOf = (step: number): SceneName =>
  step === STEP.carry
    ? "items"
    : step === STEP.labels || step === STEP.reflectNames
      ? "names"
      : step === STEP.sameBottle || step === STEP.classify
        ? "varCard"
        : step === STEP.attendance || step === STEP.names || step === STEP.tomorrow
          ? "classroom"
          : step === STEP.appIntro || step === STEP.reflectBoth
            ? "miniApp"
            : BOTTLE_STEPS.includes(step)
              ? "bottle"
              : SHOP_STEPS.includes(step)
                ? "shop"
                : WALLET_STEPS.includes(step)
                  ? "wallet"
                  : "trek";

/** The screens where a wrong answer makes the trail point at the drink. */
export const DRINK_HINT_STEPS: readonly number[] = [STEP.thirsty, STEP.noWater];

/**
 * Repeats a learner who has the idea can do without: a screen is skipped when
 * every screen listed for it was answered right the first time, with no hint.
 */
const SKIPS: Readonly<Record<number, readonly number[]>> = {
  [STEP.empty]: [STEP.addWater, STEP.drink],
  [STEP.eraser]: [STEP.shopping, STEP.total],
  [STEP.spent]: [STEP.pocket, STEP.received],
};

/**
 * Where a learner who missed a screen (or used its hint) is sent back to, once:
 * the earlier screen that taught the idea. They then go on from the screen after
 * the one they missed.
 */
const DETOURS: Readonly<Record<number, number>> = {
  [STEP.addWater]: STEP.fill,
  [STEP.drink]: STEP.fill,
  [STEP.classify]: STEP.meet,
  [STEP.names]: STEP.meet,
  [STEP.total]: STEP.prices,
  [STEP.eraser]: STEP.prices,
  [STEP.received]: STEP.addWater,
  [STEP.spent]: STEP.drink,
  [STEP.plan]: STEP.appIntro,
  [STEP.debug]: STEP.total,
};

type Detour = { to: number; resume: number };

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: nobody is sent back, and nothing is skipped.
  }
};

const skipped = (step: number) => SKIPS[step]?.every(cleanRight) ?? false;

/** The screen after `step` once the skipped ones are left out (`VARIABLE_STEPS + 1`: the end). */
const plainNext = (step: number) => {
  let next = step + 1;
  while (next <= VARIABLE_STEPS && skipped(next)) next += 1;
  return next;
};

const hrefOf = (step: number) => variableHref(step > VARIABLE_STEPS ? "complete" : step);

/**
 * Where the main button goes after screen `step`: the next one, but a screen a
 * strong learner doesn't need is skipped, and a learner who struggled is sent
 * back (once) to the screen that taught the idea, then on from where they were.
 */
export const variableNext = (step: number) => {
  const detour = read<Detour>(DETOUR_KEY);
  if (detour && step === detour.to) {
    write(DETOUR_KEY, null);
    return hrefOf(detour.resume);
  }
  const next = plainNext(step);
  const back = DETOURS[step];
  const visited = read<Record<number, true>>(DETOURED_KEY) ?? {};
  if (back !== undefined && struggled(step) && !visited[step]) {
    write(DETOURED_KEY, { ...visited, [step]: true });
    write(DETOUR_KEY, { to: back, resume: next } satisfies Detour);
    return variableHref(back);
  }
  return hrefOf(next);
};

/** Where the Back arrow goes from screen `step`. */
export const variablePrevious = (step: number) => {
  if (step <= 1) return "/level";
  let previous = step - 1;
  while (previous > 1 && skipped(previous)) previous -= 1;
  return variableHref(previous);
};
