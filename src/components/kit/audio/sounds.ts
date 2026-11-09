/**
 * The app's short sounds and buzzes, in one place for the kit:
 *   `playClickSound()`   the click of a tap
 *   `useSound(on)`       a hook giving `play("tap" | "step" | "pickup" | "win" | "lose" | "hint")` — small synthesised blips, no files
 *   `vibrate*()`         buzzes for a tap, a right or wrong answer, a lesson finished, a reward claimed
 */
export { playClickSound } from "@/components/onboarding/clickSound";
export { useSound } from "@/hooks/useSound";
export { vibrateForAnswer, vibrateForClaim, vibrateForLessonComplete, vibrateForTap } from "@/lib/haptics";
