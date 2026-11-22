import { createModuleScore } from "@/lib/moduleScore";

const score = createModuleScore("lingo.variable");

/** A question's number in the score: a screen can ask several, one per stage. */
export const questionId = (step: number, stage = 0) => step * 10 + stage;

/** Notes how a screen's question (`stage` of it) was answered; only the first answer counts. */
export const noteAnswer = (step: number, stage: number, correct: boolean) => score.noteFirstTry(questionId(step, stage), correct);

/** The share (0-100) of the questions answered right the first time; 100 if none was answered. */
export const variableAccuracy = score.firstTryAccuracy;

/** Notes that screen `step` took a wrong attempt or a hint. */
export const noteStruggle = score.noteStruggle;

/** Claims reward `id` once per run of the module. */
export const claimReward = score.claimReward;

/** Starts the score over, when the module is opened from the path. */
export const resetVariableScore = score.reset;

