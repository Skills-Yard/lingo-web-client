"use client";

import { playClickSound } from "@/components/onboarding/clickSound";
import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";
import type { AnswerResult } from "../types";

export type PrimaryButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Takes no taps but still looks pressable (a move is playing). */
  locked?: boolean;
  /** White instead of green. */
  light?: boolean;
  /** The latest checked answer: the button turns green (right) or red (wrong) with it. */
  answer?: AnswerResult | null;
  /**
   * `module`: the lesson look. There is one such button for the whole session, moved
   * from screen to screen, so show only one at a time. `onboarding`: the big sign-up
   * look, drawn by each button itself.
   */
  look?: "module" | "onboarding";
  /** Its width as a CSS length; the height follows (the art is 360 × 73). */
  width?: string;
  className?: string;
};

/** The brand's big 3D call-to-action button: a green face on a darker edge that sinks when pressed. */
export function PrimaryButton({ label, onClick, disabled, locked, light, answer, look = "module", width = "100%", className = "" }: PrimaryButtonProps) {
  return (
    <Button3D riveVariant={look} onClick={() => onClick?.()} onPress={playClickSound} disabled={disabled} locked={locked} light={light} answer={answer} className={`pointer-events-auto ${className}`} style={{ width, aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
      {label}
    </Button3D>
  );
}
