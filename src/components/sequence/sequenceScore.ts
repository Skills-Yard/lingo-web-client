import { createModuleScore } from "@/lib/moduleScore";

export type { Assist } from "@/lib/moduleScore";

const score = createModuleScore("lingo.sequence");

/** Notes how question `step` was answered; only the first answer counts. */
export const noteFirstTry = score.noteFirstTry;

/** The share (0-100) of the module's questions answered right the first time; 100 if none was answered. */
export const firstTryAccuracy = score.firstTryAccuracy;

/** Notes that screen `step` took a wrong attempt or a hint. A wrong attempt outranks a hint. */
export const noteStruggle = score.noteStruggle;

/** What screen `step` took from the learner so far (`null`: nothing, they managed alone). */
export const assistFor = score.assistFor;

/** True once the learner needed a wrong attempt or the hint on screen `step`. */
export const struggled = score.struggled;

/** Claims reward `id` once per run of the module, so replaying a screen doesn't pay again. */
export const claimReward = score.claimReward;

/** Starts the score over, when the module is opened from the path. */
export const resetFirstTry = score.reset;
