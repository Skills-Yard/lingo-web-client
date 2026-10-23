const CORRECT_PATTERN = [250];
const WRONG_PATTERN = [80, 40, 80];

const TAP_PATTERN = [110];
const LESSON_COMPLETE_PATTERN = [1200];

const CLAIM_PATTERN = [350, 70, 350, 70, 600];

/** A strong, pulsing buzz for claiming a reward. */
export function vibrateForClaim() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(CLAIM_PATTERN);
  } catch {}
}

/** One very long buzz for finishing a lesson. */
export function vibrateForLessonComplete() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(LESSON_COMPLETE_PATTERN);
  } catch {}
}

/** Short buzz for a button press. */
export function vibrateForTap() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(TAP_PATTERN);
  } catch {}
}

/** Vibrates the phone for a checked answer. No-op where the Vibration API is unavailable (iOS Safari, desktop). */
export function vibrateForAnswer(correct: boolean) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(correct ? CORRECT_PATTERN : WRONG_PATTERN);
  } catch {}
}
