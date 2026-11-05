import { createModuleScore } from "@/lib/moduleScore";

const score = createModuleScore("lingo.datatypes");

/** A question's number in the score: a screen can ask several, one per stage. */
export const questionId = (step: number, stage = 0) => step * 10 + stage;

/** Notes how a screen's question (`stage` of it) was answered; only the first answer counts. */
export const noteAnswer = (step: number, stage: number, correct: boolean) => score.noteFirstTry(questionId(step, stage), correct);

/** The share (0-100) of the questions answered right the first time; 100 if none was answered. */
export const datatypesAccuracy = score.firstTryAccuracy;

/** Notes that screen `step` took a wrong attempt or a hint. */
export const noteStruggle = score.noteStruggle;

/** True once the learner needed a wrong attempt or the hint on screen `step`. */
export const struggled = score.struggled;

/** Right the first time and without the hint: the learner has this one. */
export const cleanRight = (step: number) => score.firstTryOf(questionId(step)) === true && !score.struggled(step);

/** Where the learner's first grouping of the values is kept (screen 3 only records it, it isn't marked). */
const GROUPING_KEY = "lingo.datatypes-grouping";

/** Records how the learner first grouped the values on screen 3. */
export const noteGrouping = (groups: Readonly<Record<string, string>>) => {
  try {
    sessionStorage.setItem(GROUPING_KEY, JSON.stringify(groups));
  } catch {
    // Storage blocked: the grouping is simply not kept.
  }
};

/** Starts the score over, when the module is opened from the path. */
export const resetDatatypesScore = () => {
  score.reset();
  try {
    sessionStorage.removeItem(GROUPING_KEY);
  } catch {
    // Nothing was kept.
  }
};
