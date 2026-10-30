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
 * With the hint showing, the main button is drawn at this share of its full
 * width and `CTA_HEIGHT_WITH_HINT` of its full height (its artwork is stretched
 * to fit), and the hint is drawn as tall as that: the two are always the same
 * height, standing on the same bottom edge, so they share one centre line, and
 * the pair is centred in the row. Under 1 they are smaller than the button on a
 * screen with no hint.
 */
const CTA_WIDTH_WITH_HINT = 0.72;
export const CTA_HEIGHT_WITH_HINT = 0.82;

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

/** The gap (px) from a module button's drawn bottom edge to the bottom of the screen. */
export const BUTTON_BOTTOM_GAP = 20;

/**
 * How far (px, in the 390px frame) the button's top moved down when its bottom
 * gap became `BUTTON_BOTTOM_GAP` (it was 36px of padding under the empty band of
 * its art). A layout that flows from the top adds this above the options it
 * wants to keep the same distance from the button.
 */
export const BUTTON_DROP = 37;

/**
 * The CSS `margin-bottom` that leaves `BUTTON_BOTTOM_GAP` under a button's drawn
 * edge, for a button box `width` (a CSS length) wide, drawn `scale` of its full
 * height. The box has an empty band under its art that is taller than the gap, so
 * this is negative: the box hangs a little below the edge.
 */
export const buttonBottomMargin = (width: string, scale = 1) =>
  `calc(${BUTTON_BOTTOM_GAP}px - ${width} * ${(RIVE_BUTTON_H / RIVE_BUTTON_W) * scale * (1 - BUTTON.face.bottom)})`;

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
 * button shrinks to `CTA_WIDTH_WITH_HINT` of its width and `CTA_HEIGHT_WITH_HINT`
 * of its height, standing on the row's bottom edge like the hint does, and the
 * two sit centred in the row together.
 */
export function ActionRow({ maxWidth, hint, answer, ctaLabel, ctaDisabled, ctaLocked, onContinue }: ActionRowProps) {
  const withHint = !!hint?.visible;
  // The row is the stage's width (capped at `maxWidth`) less the padding at each
  // side. With the hint the button is shorter, so its art ends higher in the row.
  const rowWidth = `(min(var(--stage-w, 390px), ${maxWidth}px) - 12px)`;
  return (
    <div
      className="relative z-10 mx-auto w-full shrink-0 px-1.5 transition-[margin] duration-500 ease-out"
      style={{ maxWidth, marginBottom: buttonBottomMargin(rowWidth, withHint ? CTA_HEIGHT_WITH_HINT : 1) }}
    >
      <div className="flex w-full items-end justify-center" style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
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
          className={hint ? "min-w-0 transition-[width,height] duration-500 ease-out" : "min-w-0 flex-1"}
          {...(hint && {
            style: {
              aspectRatio: "auto",
              width: `${(withHint ? CTA_WIDTH_WITH_HINT : 1) * 100}%`,
              height: `${(withHint ? CTA_HEIGHT_WITH_HINT : 1) * 100}%`,
            },
          })}
        >
          {ctaLabel}
        </Button3D>
      </div>
    </div>
  );
}
