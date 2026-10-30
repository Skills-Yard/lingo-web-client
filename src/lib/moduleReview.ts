import { useState, useSyncExternalStore } from "react";
import { GRADED_STEPS, MODULE_STEPS } from "./moduleFlow";
import { resetStreak } from "./moduleStreak";
import { moduleHref } from "./routes";

/**
 * Asking again what was missed, like Duolingo. On the way through the module
 * each question's first answer is noted; after the last screen the ones answered
 * wrong are asked again, one after another, and a question missed again goes to
 * the back of the line until every one has been answered right.
 */
export type ReviewState = {
  /** Whether each question was answered right the first time (only that first answer counts). */
  firstTry: Partial<Record<number, boolean>>;
  /** The steps still to redo, in the order they come; `null` until the review has started. */
  queue: number[] | null;
  /** How many questions the review began with. */
  total: number;
  /** How many of them have been answered right since. */
  done: number;
};

const FRESH: ReviewState = { firstTry: {}, queue: null, total: 0, done: 0 };

const STORAGE_KEY = "lingo.module-review";

const isReviewState = (value: unknown): value is ReviewState =>
  typeof value === "object" &&
  value !== null &&
  "firstTry" in value &&
  typeof value.firstTry === "object" &&
  value.firstTry !== null &&
  "queue" in value &&
  (value.queue === null || (Array.isArray(value.queue) && value.queue.every((step) => typeof step === "number"))) &&
  "total" in value &&
  typeof value.total === "number" &&
  "done" in value &&
  typeof value.done === "number";

const restore = (): ReviewState => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (isReviewState(saved)) return saved;
  } catch {
    // Storage blocked or corrupt: the review just lasts for this page.
  }
  return FRESH;
};

// Lives outside React so it survives every screen being its own page, and in
// sessionStorage so a reload in the middle of the review carries on. Read on
// first use in the browser, so the server and the first client render both
// start from `FRESH` (the same as the battery's store).
let state = FRESH;
let restored = false;
const listeners = new Set<() => void>();

const read = (): ReviewState => {
  if (!restored && typeof window !== "undefined") {
    restored = true;
    state = restore();
  }
  return state;
};

const write = (next: ReviewState) => {
  state = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same as `restore`.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The graded steps answered wrong the first time, in the order they come. */
const missedSteps = ({ firstTry }: ReviewState): number[] => GRADED_STEPS.filter((step) => firstTry[step] === false);

/** Starts the module over: nothing answered, no review, no streak. */
export const resetReview = () => {
  write(FRESH);
  resetStreak();
};

/**
 * Notes how the learner answered question `step`. Only the first answer to a
 * question counts (a miss stays a miss even if they go back and fix it), and
 * nothing is noted once the review has begun.
 */
export const noteAnswer = (step: number, correct: boolean) => {
  const saved = read();
  if (saved.queue || step in saved.firstTry) return;
  write({ ...saved, firstTry: { ...saved.firstTry, [step]: correct } });
};

/**
 * Where Continue goes from question `step`, which was answered `correct` (or
 * not): the one place that decides it. In the review a right answer takes the
 * question off the list and a wrong one sends it to the back, and the next
 * question comes up, or "Lesson complete!" when none is left. On the way
 * through, the last screen goes to the review if anything was missed. Anywhere
 * else it is `next`, the screen's own next one.
 */
export const nextAfter = (step: number, correct: boolean, next: string): string => {
  const saved = read();
  if (saved.queue?.[0] === step) {
    const [, ...rest] = saved.queue;
    const queue = correct ? rest : [...rest, step];
    write({ ...saved, queue, done: correct ? saved.done + 1 : saved.done });
    return queue.length > 0 ? moduleHref(queue[0]) : moduleHref("complete");
  }
  if (step === MODULE_STEPS && !saved.queue) return missedSteps(saved).length > 0 ? moduleHref("review") : moduleHref("complete");
  return next;
};

const countOf = (saved: ReviewState) => (saved.queue ? saved.total : missedSteps(saved).length);

/** How many questions the review will ask (the ones missed on the way through), read now. */
export const missedCount = (): number => countOf(read());

/** The same, kept up to date. */
export const useMissedCount = (): number => countOf(useSyncExternalStore(subscribe, read, () => FRESH));

/** Begins the review with the questions missed, in the order they come. Returns the first, or `null` if none. */
export const startReview = (): number | null => {
  const saved = read();
  const queue = missedSteps(saved);
  write({ ...saved, queue, total: queue.length, done: 0 });
  return queue[0] ?? null;
};

/** What the progress bar shows on a question in the review. */
export type ReviewProgress = { step: number; total: number };

/**
 * The progress bar for screen `step` when it is being asked again — the bar is
 * already full at the last screen, so the total grows by the questions to redo
 * and it fills as each is answered right — or `null` when it is not. The bar
 * keeps what the screen opened with, so it doesn't jump back the moment the
 * answer is taken off the list, before the next screen has appeared.
 */
export const useReviewProgress = (step: number): ReviewProgress | null => {
  const saved = useSyncExternalStore(subscribe, read, () => FRESH);
  const [shown, setShown] = useState<ReviewProgress | null>(null);
  const live = saved.queue?.[0] === step ? { step: MODULE_STEPS + saved.done, total: MODULE_STEPS + saved.total } : null;
  if (live && (live.step !== shown?.step || live.total !== shown.total)) setShown(live);
  return live ?? shown;
};

/** Of all the graded questions, the share (0-100) answered right the first time; 100 if none was answered. */
export const firstTryAccuracy = (): number => {
  const { firstTry } = read();
  if (!GRADED_STEPS.some((step) => step in firstTry)) return 100;
  const right = GRADED_STEPS.filter((step) => firstTry[step] === true).length;
  return Math.round((right / GRADED_STEPS.length) * 100);
};
