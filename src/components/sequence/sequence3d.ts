import { sequenceNext, sequencePrevious } from "./sequence";

/**
 * The 3D copies of the Sequence screens (`/module/sequence-3d?step=`), in the order
 * they are played, named by the step of the original module each one copies. After
 * the last, Next carries on in the original module (where that step's next is).
 */
export const STEPS_3D: readonly number[] = [1, 3, 7];

export const sequence3dHref = (step: number) => `/module/sequence-3d?step=${step}`;

/** Where Next goes from the 3D copy of screen `step`: the next copy, or the original module's next screen. */
export const sequence3dNext = (step: number) => {
  const index = STEPS_3D.indexOf(step);
  const next = index >= 0 ? STEPS_3D[index + 1] : undefined;
  return next === undefined ? sequenceNext(step) : sequence3dHref(next);
};

/** Where Back goes from the 3D copy of screen `step`: the copy before it, or the original module's previous screen. */
export const sequence3dPrevious = (step: number) => {
  const index = STEPS_3D.indexOf(step);
  return index > 0 ? sequence3dHref(STEPS_3D[index - 1]) : sequencePrevious(step);
};
