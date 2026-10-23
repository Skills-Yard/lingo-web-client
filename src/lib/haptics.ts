const CORRECT_PATTERN = [250];
const WRONG_PATTERN = [80, 40, 80];

const TAP_PATTERN = [60];

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
