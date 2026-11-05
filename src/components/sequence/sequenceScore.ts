const STORAGE_KEY = "lingo.sequence-first-try";
const ASSIST_KEY = "lingo.sequence-assisted";
const REWARD_KEY = "lingo.sequence-rewards";

type FirstTry = Record<number, boolean>;

/** What a learner needed on a screen: a wrong attempt, or the hint button. */
export type Assist = "miss" | "hint";
type Assisted = Record<number, Assist>;

const readRecord = <T extends object>(key: string): T => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) ?? "{}");
    return typeof saved === "object" && saved !== null ? (saved as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const writeRecord = (key: string, value: object) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: "Lesson complete!" then shows a full score, and every learner gets the same path.
  }
};

/** Notes how question `step` was answered; only the first answer counts. */
export const noteFirstTry = (step: number, correct: boolean) => {
  const firstTry = readRecord<FirstTry>(STORAGE_KEY);
  if (step in firstTry) return;
  writeRecord(STORAGE_KEY, { ...firstTry, [step]: correct });
};

/** The share (0-100) of the module's questions answered right the first time; 100 if none was answered. */
export const firstTryAccuracy = () => {
  const answers = Object.values(readRecord<FirstTry>(STORAGE_KEY));
  if (answers.length === 0) return 100;
  return Math.round((answers.filter(Boolean).length / answers.length) * 100);
};

/** Notes that screen `step` took a wrong attempt or a hint. A wrong attempt outranks a hint. */
export const noteStruggle = (step: number, kind: Assist) => {
  const assisted = readRecord<Assisted>(ASSIST_KEY);
  if (assisted[step] === "miss" || assisted[step] === kind) return;
  writeRecord(ASSIST_KEY, { ...assisted, [step]: kind });
};

/** What screen `step` took from the learner so far (`null`: nothing, they managed alone). */
export const assistFor = (step: number): Assist | null => readRecord<Assisted>(ASSIST_KEY)[step] ?? null;

/** True once the learner needed a wrong attempt or the hint on screen `step`. */
export const struggled = (step: number) => assistFor(step) !== null;

/** Claims reward `id` once per run of the module, so replaying a screen doesn't pay again. */
export const claimReward = (id: string) => {
  const claimed = readRecord<Record<string, true>>(REWARD_KEY);
  if (claimed[id]) return false;
  writeRecord(REWARD_KEY, { ...claimed, [id]: true });
  return true;
};

/** Starts the score over, when the module is opened from the path. */
export const resetFirstTry = () => {
  for (const key of [STORAGE_KEY, ASSIST_KEY, REWARD_KEY]) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Same as `writeRecord`.
    }
  }
};
