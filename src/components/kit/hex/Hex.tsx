"use client";

import { OnboardingHex } from "@/components/level-one/FeedbackPanel";

export type HexProps = {
  /** The box he stands in (px, square). His art has room around him, so he is drawn inside it. */
  size?: number;
  /** A new key plays his entrance again. `null` loads him but keeps him waiting. */
  entryKey?: string | null;
  /** A trigger to play once he has entered (see `HEX_ONBOARDING_TRIGGER`), e.g. `continueThumb`. */
  cue?: string | null;
  /** Turns on to make him leave. */
  leaving?: boolean;
  exit?: "exitLeft" | "exitRight";
  className?: string;
};

/**
 * Hex, the guide: the character on his own Rive canvas, entering and idling by himself,
 * and talking while a voiceover plays (see `Voiceover`).
 */
export function Hex({ size = 110, entryKey = "hex", cue = null, leaving = false, exit = "exitRight", className = "" }: HexProps) {
  return (
    <div aria-hidden className={`pointer-events-none relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <OnboardingHex entryKey={entryKey} cue={cue} leaving={leaving} exit={exit} />
    </div>
  );
}
