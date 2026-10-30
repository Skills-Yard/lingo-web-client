import { ANSWER_STEPS, LEVEL_ONE_STEP } from "./moduleFlow";

/**
 * The module's run of good screens, which the progress bar celebrates with a
 * strike and the battery with a charge. A right answer and a screen passed each
 * add 1; a wrong answer puts it back to 0.
 *
 * The battery's animation never plays over a strike's: where the two meet (3
 * and 9) the strike plays and the battery is still charged. So the combined
 * triggers (`strikeDuoBattery*`, `strikeBatteryHead*`) and the `strikeHead*`
 * ones, which have no condition of their own, are not fired, nor is `comboDuo`.
 */
type StrikeFamily = "strike" | "strikeDuo" | "strikeDuo2" | "strikeMix" | "strikeSnap" | "strikeStorm";
type StrikeTrigger = StrikeFamily | "strikeBattery";

/** A trigger of `LESSON_ProgressBar`: its `Check` twin plays on the screens with a hint button. */
export type ProgressTrigger = StrikeTrigger | `${StrikeTrigger}Check`;

/** The strike that plays when the run reaches this length. */
const STRIKE_AT: Readonly<Partial<Record<number, StrikeFamily>>> = {
  1: "strike",
  3: "strikeDuo",
  5: "strikeDuo2",
  7: "strikeMix",
  8: "strikeSnap",
  9: "strikeStorm",
};

/** The battery gains `BATTERY_UNITS` each time the run is a multiple of this. */
const BATTERY_EVERY = 3;
export const BATTERY_UNITS = 1;

/** The game is graded for the review, but its result never reaches the bar, so it is left out of the run. */
const GAME_STEP = LEVEL_ONE_STEP[8];

/** Whether leaving screen `step` counts as a screen passed: it asks nothing the bar is told about. */
const countsWhenPassed = (step: number) => step !== GAME_STEP && !(ANSWER_STEPS as readonly number[]).includes(step);

/** What the run just reached: the trigger to play (if any) and whether the battery charges. */
export type StreakBeat = { trigger: ProgressTrigger | null; battery: boolean };

type StreakState = {
  /** Right answers and screens passed in a row. */
  streak: number;
  /** The furthest screen counted for being passed, so Back and forward never count one twice. */
  passed: number;
  /** The screen last opened, and whether it has a hint button: it counts once the next one opens. */
  screen: { step: number; hint: boolean } | null;
};

const FRESH: StreakState = { streak: 0, passed: 0, screen: null };

const STORAGE_KEY = "lingo.module-streak";

const isStreakState = (value: unknown): value is StreakState =>
  typeof value === "object" &&
  value !== null &&
  "streak" in value &&
  typeof value.streak === "number" &&
  "passed" in value &&
  typeof value.passed === "number" &&
  "screen" in value &&
  (value.screen === null ||
    (typeof value.screen === "object" &&
      "step" in value.screen &&
      typeof value.screen.step === "number" &&
      "hint" in value.screen &&
      typeof value.screen.hint === "boolean"));

const restore = (): StreakState => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (isStreakState(saved)) return saved;
  } catch {
    // Storage blocked or corrupt: the run just lasts for this page.
  }
  return FRESH;
};

// Lives outside React so it survives every screen being its own page, and in
// sessionStorage so a reload carries on. Read on first use in the browser.
let state = FRESH;
let restored = false;

const read = (): StreakState => {
  if (!restored && typeof window !== "undefined") {
    restored = true;
    state = restore();
  }
  return state;
};

const write = (next: StreakState) => {
  state = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same as `restore`.
  }
};

/** Starts the module over: no run, nothing passed. */
export const resetStreak = () => write(FRESH);

const beatAt = (streak: number, withHint: boolean): StreakBeat => {
  const battery = streak % BATTERY_EVERY === 0;
  const trigger: StrikeTrigger | null = STRIKE_AT[streak] ?? (battery ? "strikeBattery" : null);
  return { trigger: trigger && (withHint ? `${trigger}Check` : trigger), battery };
};

/** A checked answer was right: the run grows. `withHint`: the screen has a hint button. */
export const noteRightAnswer = (withHint: boolean): StreakBeat => {
  const saved = read();
  const streak = saved.streak + 1;
  write({ ...saved, streak });
  return beatAt(streak, withHint);
};

/** A checked answer was wrong: the run starts again. */
export const noteWrongAnswer = () => write({ ...read(), streak: 0 });

/**
 * Screen `step` has opened. If the learner got here from the screen before it
 * and that one asked nothing, it was passed: the run grows, once per screen.
 * `null` when there is nothing to play.
 */
export const openScreen = (step: number, withHint: boolean): StreakBeat | null => {
  const saved = read();
  const left = saved.screen;
  const screen = { step, hint: withHint };
  if (!left || left.step !== step - 1 || left.step <= saved.passed || !countsWhenPassed(left.step)) {
    write({ ...saved, screen });
    return null;
  }
  const streak = saved.streak + 1;
  write({ streak, passed: left.step, screen });
  return beatAt(streak, left.hint);
};
