import type { Rive } from "@rive-app/canvas";

/** The part of a state machine this steps (the library keeps its animator private). */
type Stepped = { advanceAndApply(seconds: number): void };

/** How long (s) one step is: small, so a machine's own transitions (which take a little time) follow one another as they do when played. */
const STEP_S = 0.1;

/**
 * Plays what a Rive is playing to its end at once, without it being watched: its state machines are stepped on by `seconds`, in
 * small steps, in one go. Skipping a one-shot effect (a lightning strike, a button's electric) this way leaves the artwork where
 * it would have ended up, instead of cutting it off or restarting the file.
 */
export const fastForward = (rive: Rive | null | undefined, seconds: number) => {
  const machines = (rive as unknown as { animator?: { stateMachines: Stepped[] } } | null | undefined)?.animator?.stateMachines;
  if (!machines) return;
  for (let played = 0; played < seconds; played += STEP_S) machines.forEach((machine) => machine.advanceAndApply(STEP_S));
};
