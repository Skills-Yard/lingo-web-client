import { createModuleScore } from "@/lib/moduleScore";

const score = createModuleScore("lingo.level-one");

/** Starts Module 1's score over, when the module is opened from the path. */
export const resetLevelOneScore = score.reset;
