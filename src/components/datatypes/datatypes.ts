import { createAdaptiveFlow } from "@/lib/adaptiveFlow";
import { datatypesHref } from "@/lib/routes";
import { cleanRight, struggled } from "./datatypesScore";

/** The Data Types module's screens, for its progress bar. */
export const DATATYPES_STEPS = 30;

/** Its place on the level path. */
export const DATATYPES_LEVEL = 4;

/** Whether `step` (the URL's) is one of the module's screens (0 is its title screen). */
export const isDatatypesStep = (step: string) => step === "complete" || (/^\d+$/.test(step) && Number(step) >= STEP.intro && Number(step) <= DATATYPES_STEPS);

/**
 * Where each screen sits in the module (`/module/datatypes?step=`): the PDF's screens 1-24, its five reflection questions, then the last one.
 * The title screen "Let's Learn Data types" is 0, before them: numbering it 0 keeps every other screen's number, the progress bar's total (it
 * starts empty there) and the battery's count (it restarts at screen 1) as they were.
 */
export const STEP = {
  intro: 0,
  eventInfo: 1,
  meetAarav: 2,
  sortSimilar: 3,
  groups: 4,
  counting: 5,
  wholeDecimal: 6,
  integers: 7,
  floats: 8,
  classifyNumbers: 9,
  names: 10,
  textLooks: 11,
  strings: 12,
  twelve: 13,
  attendance: 14,
  twoStates: 15,
  boolean: 16,
  fourTypes: 17,
  beyond: 18,
  shopping: 19,
  profile: 20,
  weather: 21,
  plan: 22,
  debug: 23,
  game: 24,
  reflectInt: 25,
  reflectFloat: 26,
  reflectId: 27,
  reflectBool: 28,
  reflectApp: 29,
  recap: 30,
} as const;

const flow = createAdaptiveFlow({
  steps: DATATYPES_STEPS,
  hrefOf: datatypesHref,
  home: "/level",
  skips: {
    [STEP.twoStates]: [STEP.attendance],
    [STEP.profile]: [STEP.classifyNumbers, STEP.beyond],
    [STEP.reflectInt]: [STEP.classifyNumbers, STEP.profile],
    [STEP.reflectFloat]: [STEP.floats, STEP.classifyNumbers],
    [STEP.reflectId]: [STEP.beyond, STEP.game],
    [STEP.reflectBool]: [STEP.attendance, STEP.boolean],
    [STEP.reflectApp]: [STEP.weather, STEP.plan],
  },
  detours: {
    [STEP.classifyNumbers]: STEP.wholeDecimal,
    [STEP.twelve]: STEP.strings,
    [STEP.beyond]: STEP.fourTypes,
    [STEP.profile]: STEP.fourTypes,
    [STEP.weather]: STEP.fourTypes,
    [STEP.plan]: STEP.classifyNumbers,
    [STEP.debug]: STEP.floats,
    [STEP.game]: STEP.profile,
    [STEP.reflectInt]: STEP.integers,
    [STEP.reflectFloat]: STEP.floats,
    [STEP.reflectId]: STEP.strings,
    [STEP.reflectBool]: STEP.boolean,
    [STEP.reflectApp]: STEP.weather,
  },
  cleanRight,
  struggled,
  detourKey: "lingo.datatypes-detour",
  detouredKey: "lingo.datatypes-detoured",
});

/** Where the main button goes after screen `step`: the next one, a repeat skipped for a strong learner, or back (once) to the screen that taught the idea for one who struggled. */
export const datatypesNext = flow.next;

/** Where the Back arrow goes from screen `step`: the first screen goes back to the title screen, which goes to the path. */
export const datatypesPrevious = (step: number) => (step <= STEP.intro ? "/level" : step === STEP.eventInfo ? datatypesHref(STEP.intro) : flow.previous(step));

/** Forgets the pending detour (the module starts over). */
export const resetDatatypesFlow = flow.reset;
