/**
 * The module's run of right answers, which the progress bar celebrates with a
 * strike and the battery with a charge. Each checked right answer adds 1; a
 * wrong answer puts it back to 0. Opening or leaving a screen never touches it.
 *
 * Of the bar's triggers only three are played: `strikeDuo2` on the 2nd right
 * answer in a row, `strikeMix` on the 4th, and `strikeLoop` (a switch, not a
 * trigger) on the 5th.
 */
type StrikeTrigger = "strikeDuo2" | "strikeMix";

/** A trigger of `LESSON_ProgressBar`: its `Check` twin plays on the screens with a hint button. */
export type ProgressTrigger = StrikeTrigger | `${StrikeTrigger}Check`;

/** The strike that plays when the run reaches this length. */
const STRIKE_AT: Readonly<Partial<Record<number, StrikeTrigger>>> = {
  2: "strikeDuo2",
  4: "strikeMix",
};

/** How long each strike's clip plays, in seconds (`S_Duo2` and `S_Mix` in `progressBar.riv`; the `Check` twins are as long). */
const STRIKE_SECONDS: Readonly<Record<StrikeTrigger, number>> = {
  strikeDuo2: 0.9,
  strikeMix: 1.6,
};

/** The run length where `strikeLoop` switches on, and for how long each time it does (the last holds for every later one). */
const LOOP_AT = 5;
const LOOP_SECONDS = [1, 4, 7] as const;

/** The battery gains `BATTERY_UNITS` each time the run is a multiple of this. */
const BATTERY_EVERY = 3;
export const BATTERY_UNITS = 1;

/**
 * What the run just reached: the trigger to play (if any), how long to loop (if
 * at all) and whether the battery charges. `playSeconds` is how long the bar's
 * part of it takes, the strike's clip or the loop, whichever is longer.
 */
export type StreakBeat = {
  trigger: ProgressTrigger | null;
  loopSeconds: number | null;
  battery: boolean;
  playSeconds: number;
};

type StreakState = {
  /** Right answers in a row. */
  streak: number;
  /** How many times the loop has switched on, so each time holds longer than the one before. */
  loops: number;
};

const FRESH: StreakState = { streak: 0, loops: 0 };

const STORAGE_KEY = "lingo.module-streak";

const isStreakState = (value: unknown): value is StreakState =>
  typeof value === "object" &&
  value !== null &&
  "streak" in value &&
  typeof value.streak === "number" &&
  "loops" in value &&
  typeof value.loops === "number";

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

/** Starts the module over: no run, no loops played. */
export const resetStreak = () => write(FRESH);

/** A checked answer was right: the run grows. `withHint`: the screen has a hint button. */
export const noteRightAnswer = (withHint: boolean): StreakBeat => {
  const saved = read();
  const streak = saved.streak + 1;
  const looping = streak === LOOP_AT;
  const loopSeconds = looping ? LOOP_SECONDS[Math.min(saved.loops, LOOP_SECONDS.length - 1)] : null;
  write({ streak, loops: looping ? saved.loops + 1 : saved.loops });
  const strike = STRIKE_AT[streak];
  const trigger: ProgressTrigger | null = strike ? (withHint ? `${strike}Check` : strike) : null;
  return {
    trigger,
    loopSeconds,
    battery: streak % BATTERY_EVERY === 0,
    playSeconds: Math.max(strike ? STRIKE_SECONDS[strike] : 0, loopSeconds ?? 0),
  };
};

/** A checked answer was wrong: the run starts again. */
export const noteWrongAnswer = () => write({ ...read(), streak: 0 });
