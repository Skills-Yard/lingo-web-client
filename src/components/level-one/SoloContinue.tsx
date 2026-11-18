"use client";

import { buttonBottomMargin, soloButtonWidth } from "@/components/level-one/ActionRow";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";

/** The widest phone (px): past it the screen stops growing, and the button stays the same size in the middle. */
export const PHONE_MAX_W = 430;

/** The one Continue button standing at the foot of a full-screen artboard screen ("Lesson complete!", the reward chest). */
export function SoloContinue({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 mx-auto flex justify-center"
      style={{ maxWidth: PHONE_MAX_W, marginBottom: buttonBottomMargin(`(min(100vw, ${PHONE_MAX_W}px) - 32px)`) }}
    >
      <Button3D
        riveVariant="module"
        onClick={onClick}
        onPress={playClickSound}
        className="shrink-0"
        style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}`, width: soloButtonWidth(`min(100vw, ${PHONE_MAX_W}px)`) }}
      >
        Continue
      </Button3D>
    </div>
  );
}
