import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";

/** What a tap feels like: the click sound and a short buzz. Every pressable kit component does this. */
export function feelTap() {
  playClickSound();
  vibrateForTap();
}
