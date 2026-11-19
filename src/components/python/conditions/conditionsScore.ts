import { createModuleScore } from "@/lib/moduleScore";

const score = createModuleScore("lingo.conditions");

/** A question's number in the score: a screen can ask several, one per stage. */
export const questionId = (step: number, stage = 0) => step * 10 + stage;

/** Notes how a screen's question (`stage` of it) was answered; only the first answer counts. */
export const noteAnswer = (step: number, stage: number, correct: boolean) => score.noteFirstTry(questionId(step, stage), correct);

/** The share (0-100) of the questions answered right the first time; 100 if none was answered. */
export const conditionsAccuracy = score.firstTryAccuracy;

/** Notes that screen `step` took a wrong attempt or a hint. */
export const noteStruggle = score.noteStruggle;

/** True once the learner needed a wrong attempt or the hint on screen `step`. */
export const struggled = score.struggled;

/** True when `stage` of screen `step` was answered, and not right the first time. */
export const missedStage = (step: number, stage: number) => score.firstTryOf(questionId(step, stage)) === false;

/** Right the first time and without the hint: the learner has this one. */
export const answeredClean = (step: number) => score.firstTryOf(questionId(step)) === true && !score.struggled(step);

/** Starts the score over, when the module is opened from the path. */
export const resetConditionsScore = score.reset;
