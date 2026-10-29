/** Screens in the module (the progress bar's total). */
export const MODULE_STEPS = 16;

/** Where the screens that began as Level 1's sit in the module, by their
 * number there. Its 1st and 2nd are not in the module, its 7th ("What are
 * instructions known as?") is the module's 11th, and its reward screen is
 * not in it. */
export const LEVEL_ONE_STEP = { 3: 12, 4: 13, 5: 14, 6: 15, 8: 16 } as const;

export type LevelOneStepKey = keyof typeof LEVEL_ONE_STEP;
