import type { OptionState } from "../types";

/**
 * How one answer of a single-choice set looks. After checking, the right answer is
 * green and a wrong pick is red. With `reveal` off, the right answer is not shown
 * when the pick was wrong (so the learner can try again without being told).
 */
export function optionState(id: string, selectedId: string | null, checked: boolean, correctId?: string, reveal = true): OptionState {
  if (checked && correctId !== undefined) {
    if (id === correctId && (reveal || id === selectedId)) return "correct";
    if (id === selectedId) return "wrong";
  }
  return id === selectedId ? "selected" : "idle";
}

/** The same for a set where several can be picked: picks are right or wrong, a missed right one is shown when `reveal` is on. */
export function multiOptionState(id: string, selectedIds: readonly string[], checked: boolean, correctIds?: readonly string[], reveal = true): OptionState {
  const picked = selectedIds.includes(id);
  if (checked && correctIds) {
    const right = correctIds.includes(id);
    if (picked) return right ? "correct" : "wrong";
    if (right && reveal) return "correct";
    return "idle";
  }
  return picked ? "selected" : "idle";
}
