import { variableHref } from "@/lib/routes";
import type { SceneName } from "@/lib/rive/variableHost";

/** The Variable module's screens, for its progress bar. */
export const VARIABLE_STEPS = 34;

/** Its place on the level path. */
export const VARIABLE_LEVEL = 3;

/** Whether `step` (the URL's) is one of the module's screens. */
export const isVariableStep = (step: string) => step === "complete" || (/^\d+$/.test(step) && Number(step) >= STEP.intro && Number(step) <= VARIABLE_STEPS);

/**
 * Where each screen sits in the module (`/module/variable?step=`); the PDF's screens 1-29, then its four questions, then the last one.
 * The title screen "Let's Learn Variables" is 0, before them: it is not one of the PDF's screens, and numbering it 0 keeps every other
 * screen's number, the progress bar's total (it starts empty there) and the battery's count (it restarts at screen 1) as they were.
 */
export const STEP = {
  intro: 0,
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
const BOTTLE_STEPS: readonly number[] = [STEP.bottle, STEP.bridge, STEP.fill, STEP.addWater, STEP.drink, STEP.empty, STEP.meet];

/** The screens about the notebook, pen and eraser (the shop counter), and about the pocket money (the wallet). */
const SHOP_STEPS: readonly number[] = [STEP.shopping, STEP.prices, STEP.total, STEP.eraser, STEP.debug];
const WALLET_STEPS: readonly number[] = [STEP.pocket, STEP.received, STEP.spent, STEP.follow];

/** What stands behind a screen: one of the host scenes, or the bottle and the wallet side by side (screen 31, two scenes at once). */
export type SceneKind = SceneName | "bottleWallet";

/**
 * The scene behind a screen: the four objects on "Pick the Right Object", the bottle (screens 5-8, 10, 11 and 13; on 6 and 13 with its variable card), the
 * labelled bottles on "Which bottle is mine?" and "Why Meaningful Names?", the pair of variable cards on "Same Bottle, New
 * Amount" and on "Name or Value?" (both its stages), the classroom on "A New Day at School!" and "Three
 * Pieces of Data" (both its stages), the shop, the wallet, the bottle and the wallet side by side on "Can Values Change?", and the trail on every other.
 */
export const sceneOf = (step: number): SceneKind => {
  if (step === STEP.carry) return "items";
  if (step === STEP.reflectChange) return "bottleWallet";
  if (step === STEP.labels || step === STEP.reflectNames) return "names";
  if (step === STEP.sameBottle || step === STEP.classify) return "varCard";
  if (step === STEP.attendance || step === STEP.names || step === STEP.tomorrow) return "classroom";
  if (step === STEP.appIntro || step === STEP.reflectBoth) return "miniApp";
  if (BOTTLE_STEPS.includes(step)) return "bottle";
  if (SHOP_STEPS.includes(step)) return "shop";
  if (WALLET_STEPS.includes(step)) return "wallet";
  return "trek";
};

/** The screens where a wrong answer makes the trail point at the drink. */
export const DRINK_HINT_STEPS: readonly number[] = [STEP.thirsty, STEP.noWater];

/**
 * Where the main button goes after screen `step`: always the next one, 0 to 34 and then "Lesson complete!". No screen
 * is skipped and nobody is sent back to an earlier one, whatever they answered.
 */
export const variableNext = (step: number) => variableHref(step >= VARIABLE_STEPS ? "complete" : step + 1);

/** Where the Back arrow goes from screen `step`: the one before it (the title screen, 0, goes to the path). */
export const variablePrevious = (step: number) => (step <= STEP.intro ? "/level" : variableHref(step - 1));
