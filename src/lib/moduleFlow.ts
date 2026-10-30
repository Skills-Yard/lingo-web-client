/** Screens in the module (the progress bar's total). */
export const MODULE_STEPS = 16;

/** The screens that ask a question with a right and a wrong answer, in the
 * order they come: the ones asked again if they were missed (see `moduleReview`).
 * The matching screen (6) is not one: it can't be left until every pair is right. */
export const GRADED_STEPS = [3, 4, 5, 8, 11, 13, 16] as const;

/** The screens that send the progress bar a checked answer (right or wrong), so
 * the streak counts them by it and not when they are left. The matching screen
 * sends one per pair; the last screen is graded for the review but sends none. */
export const ANSWER_STEPS = [3, 4, 5, 6, 8, 11, 13] as const;

/** Where the screens that began as Level 1's sit in the module, by their
 * number there. Its 1st and 2nd are not in the module, its 7th ("What are
 * instructions known as?") is the module's 11th, and its reward screen is
 * not in it. */
export const LEVEL_ONE_STEP = { 3: 12, 4: 13, 5: 14, 6: 15, 8: 16 } as const;

export type LevelOneStepKey = keyof typeof LEVEL_ONE_STEP;
