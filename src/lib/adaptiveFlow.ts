type Detour = { to: number; resume: number };

type AdaptiveFlowOptions = {
  /** How many screens the module has; the screen after the last is its end. */
  steps: number;
  /** The URL of screen `step`, or of the module's end (`"complete"`). */
  hrefOf: (step: number | "complete") => string;
  /** Where the Back arrow goes from the first screen. */
  home: string;
  /**
   * Repeats a learner who has the idea can do without: a screen is skipped when
   * every screen listed for it was answered right the first time, with no hint.
   */
  skips: Readonly<Record<number, readonly number[]>>;
  /**
   * Where a learner who missed a screen (or used its hint) is sent back to, once:
   * the earlier screen that taught the idea. They then go on from the screen after
   * the one they missed. A function chooses the screen from how the learner did
   * (or none, with `undefined`).
   */
  detours: Readonly<Record<number, number | (() => number | undefined)>>;
  /** Right the first time and without the hint. */
  cleanRight: (step: number) => boolean;
  /** Needed a wrong attempt or the hint. */
  struggled: (step: number) => boolean;
  /** Where the pending detour, and the screens already revisited, are kept (session storage). */
  detourKey: string;
  detouredKey: string;
};

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: nobody is sent back, and nothing is skipped.
  }
};

/**
 * A module's way through its screens that adapts to the learner: a strong
 * learner skips the repeats, and one who struggled is sent back (once) to the
 * screen that taught the idea, then on from where they were. Read in the
 * browser only (it uses session storage).
 */
export function createAdaptiveFlow({ steps, hrefOf, home, skips, detours, cleanRight, struggled, detourKey, detouredKey }: AdaptiveFlowOptions) {
  const skipped = (step: number) => skips[step]?.every(cleanRight) ?? false;

  /** The screen after `step` once the skipped ones are left out (`steps + 1`: the end). */
  const plainNext = (step: number) => {
    let next = step + 1;
    while (next <= steps && skipped(next)) next += 1;
    return next;
  };

  const href = (step: number) => hrefOf(step > steps ? "complete" : step);

  /** Where the main button goes after screen `step`. */
  const next = (step: number) => {
    const detour = read<Detour>(detourKey);
    if (detour && step === detour.to) {
      write(detourKey, null);
      return href(detour.resume);
    }
    const after = plainNext(step);
    // A screen can pick where to send the learner from what went wrong on it (a function), or always the same place.
    const rule = detours[step];
    const back = typeof rule === "function" ? rule() : rule;
    const visited = read<Record<number, true>>(detouredKey) ?? {};
    if (back !== undefined && struggled(step) && !visited[step]) {
      write(detouredKey, { ...visited, [step]: true });
      write(detourKey, { to: back, resume: after } satisfies Detour);
      return hrefOf(back);
    }
    return href(after);
  };

  /** Where the Back arrow goes from screen `step`. */
  const previous = (step: number) => {
    if (step <= 1) return home;
    let before = step - 1;
    while (before > 1 && skipped(before)) before -= 1;
    return hrefOf(before);
  };

  /** Forgets the pending detour and the screens visited (the module starts over). */
  const reset = () => {
    for (const key of [detourKey, detouredKey]) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Nothing was kept.
      }
    }
  };

  return { next, previous, reset };
}
