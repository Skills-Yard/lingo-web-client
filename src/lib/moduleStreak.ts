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

/** The run length where `strikeLoop` switches on, and for how long each time it does (the last holds for every later one). */
const LOOP_AT = 5;
const LOOP_SECONDS = [1, 4, 7] as const;

/** The battery gains `BATTERY_UNITS` each time the run is a multiple of this. */
const BATTERY_EVERY = 3;
export const BATTERY_UNITS = 1;

/**
 * What the run just reached: the trigger to play (if any), how long to loop (if
 * at all) and whether the battery charges.
 */
export type StreakBeat = {
  trigger: ProgressTrigger | null;
  loopSeconds: number | null;
  battery: boolean;
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

/** The gem popup (and the battery it claims) comes with every this-many games won, not with each one. */
const REWARD_EVERY = 3;
const WINS_KEY = "lingo.module-game-wins";

let wins = 0;
let winsRestored = false;

const readWins = (): number => {
  if (!winsRestored && typeof window !== "undefined") {
    winsRestored = true;
    try {
      const saved = Number(sessionStorage.getItem(WINS_KEY));
      wins = Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      // Storage blocked: the count just lasts for this page.
    }
  }
  return wins;
};

const writeWins = (next: number) => {
  wins = next;
  try {
    sessionStorage.setItem(WINS_KEY, String(next));
  } catch {
    // Same as `readWins`.
  }
};

/** A board game was won: whether this win brings the gem popup (every `REWARD_EVERY`th). */
export const noteGameWin = (): boolean => {
  const next = readWins() + 1;
  writeWins(next);
  return next % REWARD_EVERY === 0;
};

/** Starts the module over: no run, no loops played, no games won. */
export const resetStreak = () => {
  write(FRESH);
  writeWins(0);
};

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
  };
};

/** A checked answer was wrong: the run starts again. */
export const noteWrongAnswer = () => write({ ...read(), streak: 0 });
