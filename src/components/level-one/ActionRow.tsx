"use client";

import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { playClickSound } from "@/components/onboarding/clickSound";
import { BUTTON } from "@/lib/rive/runtime";
import { HintButton, type HintSize } from "./HintButton";

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

/**
 * The hint button is as tall as the drawn face of the main button beside it,
 * top to bottom: the face spans `BUTTON.face` of the button's box, which is
 * `CTA_HEIGHT_WITH_HINT` of the row and stands on the row's bottom edge. It is a
 * square, so its width is that same length as a share of the row's width (the row's
 * shape is the button's own, so a share of the height is `height / width` of one).
 */
const HINT_HEIGHT = (BUTTON.face.bottom - BUTTON.face.top) * CTA_HEIGHT_WITH_HINT;
const HINT_SIZE: HintSize = {
  height: `${HINT_HEIGHT * 100}%`,
  width: `${HINT_HEIGHT * (RIVE_BUTTON_H / RIVE_BUTTON_W) * 100}%`,
  lift: `${(1 - BUTTON.face.bottom) * CTA_HEIGHT_WITH_HINT * 100}%`,
};

type ActionRowProps = {
  /** The row's widest width (px) — it keeps its phone size on a desktop. */
  maxWidth: number;
  /** Shows the hint button at the left end of the row; `visible` slides it in / out. */
  hint?: { visible: boolean; onUse: () => void };
  answer?: AnswerResult | null;
  /** Label of the main button. */
  ctaLabel: string;
  ctaDisabled?: boolean;
  /** The main button takes no clicks, but is drawn enabled. */
  ctaLocked?: boolean;
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
export function ActionRow({ maxWidth, hint, answer, ctaLabel, ctaDisabled, ctaLocked, onContinue }: ActionRowProps) {
  const withHint = !!hint?.visible;
  return (
    <div className="relative z-10 mx-auto w-full shrink-0 px-1.5 pb-9" style={{ maxWidth }}>
      <div className="flex w-full items-end" style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
        {hint && (
          <HintButton
            visible={hint.visible}
            count={HINTS_LEFT}
            size={HINT_SIZE}
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
          locked={ctaLocked}
          className={hint ? "min-w-0 flex-1 transition-[height] duration-500 ease-out" : "min-w-0 flex-1"}
          {...(hint && { style: { aspectRatio: "auto", height: `${(withHint ? CTA_HEIGHT_WITH_HINT : 1) * 100}%` } })}
        >
          {ctaLabel}
        </Button3D>
      </div>
    </div>
  );
}
