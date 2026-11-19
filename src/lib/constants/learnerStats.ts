/** The learner's streak, gems and battery: one place, so every screen that
 * shows them (the top bar, the home, the dashboard) shows the same numbers. */
export const LEARNER_STATS = {
  streak: 4,
  gems: 373,
  hints: 2,
  battery: { current: 18, max: 20 },
} as const;
