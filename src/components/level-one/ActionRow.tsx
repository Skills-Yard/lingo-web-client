"use client";

import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { playClickSound } from "@/components/onboarding/clickSound";
import { HintButton } from "./HintButton";

/** The badge count — fixed at 1 for now. */
const HINTS_LEFT = 1;
/**
 * With the hint showing, the main button is drawn this share of the row's
 * height, in whatever width is left beside the hint. Its artwork can't be
 * made narrower without getting shorter (it is one fixed-shape drawing), so it
 * is squeezed a little across instead: almost as tall as the button on a screen
 * with no hint, and still the same shape.
 */
export const CTA_HEIGHT_WITH_HINT = 0.9;

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
 * and Continue as one component. The row is the same height with or without
 * the hint (the height follows its width, at the full-width button's own
 * ratio), so no screen's layout changes when it has one; with the hint, the
 * button narrows beside it and drops to `CTA_HEIGHT_WITH_HINT` of the row,
 * standing on the row's bottom edge like the hint does.
 */
export function ActionRow({ maxWidth, hint, answer, ctaLabel, ctaDisabled, onContinue }: ActionRowProps) {
  const withHint = !!hint?.visible;
  return (
    <div className="relative z-10 mx-auto w-full shrink-0 px-1.5 pb-9" style={{ maxWidth }}>
      <div className="flex w-full items-end" style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
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
          stretch={!!hint}
          answer={answer}
          onClick={() => onContinue?.()}
          onPress={playClickSound}
          disabled={ctaDisabled}
          className={hint ? "min-w-0 flex-1 transition-[height] duration-500 ease-out" : "min-w-0 flex-1"}
          {...(hint && { style: { aspectRatio: "auto", height: `${(withHint ? CTA_HEIGHT_WITH_HINT : 1) * 100}%` } })}
        >
          {ctaLabel}
        </Button3D>
      </div>
    </div>
  );
}
