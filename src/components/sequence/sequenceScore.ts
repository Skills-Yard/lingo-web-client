const STORAGE_KEY = "lingo.sequence-first-try";

type FirstTry = Record<number, boolean>;

const read = (): FirstTry => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof saved === "object" && saved !== null ? (saved as FirstTry) : {};
  } catch {
    return {};
  }
};

/** Notes how question `step` was answered; only the first answer counts. */
export const noteFirstTry = (step: number, correct: boolean) => {
  const firstTry = read();
  if (step in firstTry) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...firstTry, [step]: correct }));
  } catch {
    // Storage blocked: "Lesson complete!" then shows a full score.
  }
};

/** The share (0-100) of the module's questions answered right the first time; 100 if none was answered. */
export const firstTryAccuracy = () => {
  const answers = Object.values(read());
  if (answers.length === 0) return 100;
  return Math.round((answers.filter(Boolean).length / answers.length) * 100);
};

/** Starts the score over, when the module is opened from the path. */
export const resetFirstTry = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Same as `noteFirstTry`.
  }
};
