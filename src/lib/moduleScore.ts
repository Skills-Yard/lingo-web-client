/** What a learner needed on a screen: a wrong attempt, or the hint button. */
export type Assist = "miss" | "hint";

type FirstTry = Record<number, boolean>;
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

/**
 * One module's record of how its screens went, kept in session storage under
 * `prefix`: how each question was answered the first time, what each screen took
 * from the learner (a miss or the hint), and which rewards were already paid.
 * Questions are numbered by the module (a screen with several questions uses a
 * number for each).
 */
export function createModuleScore(prefix: string) {
  const FIRST_TRY = `${prefix}-first-try`;
  const ASSISTED = `${prefix}-assisted`;
  const REWARDS = `${prefix}-rewards`;

  /** Notes how question `id` was answered; only the first answer counts. */
  const noteFirstTry = (id: number, correct: boolean) => {
    const firstTry = readRecord<FirstTry>(FIRST_TRY);
    if (id in firstTry) return;
    writeRecord(FIRST_TRY, { ...firstTry, [id]: correct });
  };

  /** How question `id` was answered the first time (`undefined`: not answered yet). */
  const firstTryOf = (id: number): boolean | undefined => readRecord<FirstTry>(FIRST_TRY)[id];

  /** The share (0-100) of the questions answered right the first time; 100 if none was answered. */
  const firstTryAccuracy = () => {
    const answers = Object.values(readRecord<FirstTry>(FIRST_TRY));
    if (answers.length === 0) return 100;
    return Math.round((answers.filter(Boolean).length / answers.length) * 100);
  };

  /** Notes that screen `step` took a wrong attempt or a hint. A wrong attempt outranks a hint. */
  const noteStruggle = (step: number, kind: Assist) => {
    const assisted = readRecord<Assisted>(ASSISTED);
    if (assisted[step] === "miss" || assisted[step] === kind) return;
    writeRecord(ASSISTED, { ...assisted, [step]: kind });
  };

  /** What screen `step` took from the learner so far (`null`: nothing, they managed alone). */
  const assistFor = (step: number): Assist | null => readRecord<Assisted>(ASSISTED)[step] ?? null;

  /** True once the learner needed a wrong attempt or the hint on screen `step`. */
  const struggled = (step: number) => assistFor(step) !== null;

  /** Claims reward `id` once per run of the module, so replaying a screen doesn't pay again. */
  const claimReward = (id: string) => {
    const claimed = readRecord<Record<string, true>>(REWARDS);
    if (claimed[id]) return false;
    writeRecord(REWARDS, { ...claimed, [id]: true });
    return true;
  };

  /** Starts the score over, when the module is opened from the path. */
  const reset = () => {
    for (const key of [FIRST_TRY, ASSISTED, REWARDS]) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Same as `writeRecord`.
      }
    }
  };

  return { noteFirstTry, firstTryOf, firstTryAccuracy, noteStruggle, assistFor, struggled, claimReward, reset };
}
