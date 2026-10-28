const DONE_KEY = "lingo:modules-done";
const JUST_DONE_KEY = "lingo:module-just-done";

/** Modules there are screens for (`/module?level=N`). */
export const PLAYABLE_MODULES = 2;

/** How many modules the learner has finished (0 when none / storage is
 * unavailable). Kept in local storage so the path remembers it. */
export function readModulesDone(): number {
  try {
    const value = Number(window.localStorage.getItem(DONE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

/** Records module `level` (1-based) as finished, and that the path should
 * play Hex moving on to the next block the next time it opens. Finishing a
 * module again (a replay) changes nothing. */
export function completeModule(level: number): void {
  try {
    if (level <= readModulesDone()) return;
    window.localStorage.setItem(DONE_KEY, String(level));
    window.sessionStorage.setItem(JUST_DONE_KEY, "1");
  } catch {
    // The path just stays where it was.
  }
}

/** True after `completeModule`, until the path has played Hex moving on
 * (`clearModuleJustDone`). */
export function readModuleJustDone(): boolean {
  try {
    return window.sessionStorage.getItem(JUST_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearModuleJustDone(): void {
  try {
    window.sessionStorage.removeItem(JUST_DONE_KEY);
  } catch {
    // Then it is simply played again next time.
  }
}

/** Forgets every finished module (the path starts over). */
export function resetModules(): void {
  try {
    window.localStorage.removeItem(DONE_KEY);
    window.sessionStorage.removeItem(JUST_DONE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}
