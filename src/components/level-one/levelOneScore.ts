import { createModuleScore } from "@/lib/moduleScore";

const score = createModuleScore("lingo.level-one");

/** Claims reward `id` once per run of Module 1, so replaying a game doesn't pay again. */
export const claimReward = score.claimReward;

/** Starts Module 1's rewards over, when the module is opened from the path. */
export const resetLevelOneScore = score.reset;
