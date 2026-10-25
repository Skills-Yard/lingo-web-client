"use client";

import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { playClickSound } from "@/components/onboarding/clickSound";
import { HintButton } from "./HintButton";

/** The badge count — fixed at 1 for now. */
const HINTS_LEFT = 1;

type ActionRowProps = {
  /** The row's widest width (px) — it keeps its phone size on a desktop. */
  maxWidth: number;
  /** Shows the hint button at the left end of the row; `visible` slides it in / out. */
  hint?: { visible: boolean; onUse: () => void };
  answer?: AnswerResult | null;
  /** Label of the main button. */
  ctaLabel: string;
  ctaDisabled?: boolean;
  onContinue?: () => void;
};

/**
 * The bottom row of every Level 1 screen: the hint button (where there is one)
 * and Continue as one component, spread to the two ends of the row
 * (`justify-between`). With the hint showing, the row touches the side
 * walls (6px in from them otherwise).
 */
export function ActionRow({ maxWidth, hint, answer, ctaLabel, ctaDisabled, onContinue }: ActionRowProps) {
  return (
    <div className={`relative z-10 mx-auto w-full shrink-0 pb-9 ${hint ? "px-0" : "px-1.5"}`} style={{ maxWidth }}>
      {/* Fixed at the full-width button's own ratio, so the row never changes
        height while the hint slides in and the button narrows beside it. */}
      <div className="flex w-full items-center justify-between" style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
        {hint && (
          <HintButton
            visible={hint.visible}
            count={HINTS_LEFT}
            onPress={() => {
              playClickSound();
              hint.onUse();
            }}
          />
        )}
        <Button3D
          riveVariant="module"
          answer={answer}
          onClick={() => onContinue?.()}
          onPress={playClickSound}
          disabled={ctaDisabled}
          className={`min-w-0 flex-1 ${hint ? "transition-[height] duration-500 ease-out" : ""}`}
          // With the hint showing, the button's art is drawn with margins that
          // make it look small: it is scaled up from its right edge, so it
          // grows away from the hint.
          {...(hint && { style: { aspectRatio: "auto", height: "100%", transform: "scale(1.2)", transformOrigin: "right center" } })}
        >
          {ctaLabel}
        </Button3D>
      </div>
    </div>
  );
}
