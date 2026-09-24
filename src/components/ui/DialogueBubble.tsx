import type { ReactNode } from "react";

// Measured off `public/images/dialogue-box.png`, the design asset this bubble
// reproduces: a 3px light-green outline, a flat dark-green shadow offset 3px
// straight down, and a V-notch tail. Kept as constants so the box, the tail
// and the shadow can't drift apart from each other.
const STROKE_COLOR = "#87e494";
const SHADOW_COLOR = "#005731";
const STROKE_WIDTH = 3;
const SHADOW_OFFSET = 3;
/** The box's fill, and the tail's patch that erases the border under it —
 * one CSS variable so a dark-mode caller can retheme both with a single
 * `dark:[--bubble-fill:#12141A]` on `className` instead of the box and the
 * tail's SVG each needing their own `dark:` variant kept in sync. */
const FILL = "var(--bubble-fill, #ffffff)";
/** Deliberately tighter than the source asset's full pill (which needs a lot
 * of padding to keep text off its curved ends) — a modest rounded-rectangle
 * corner that stays the same however many lines the text wraps to. */
const DEFAULT_RADIUS = 20;

// The tail is a fixed-size SVG, since — unlike the box — it shouldn't scale
// with the text. Its y=0 sits on the *inner* edge of the box's border, so the
// border's own centerline is at y=STROKE_WIDTH/2 and the tail's V starts
// there and dives TAIL_DEPTH below it.
const TAIL_WIDTH = 34;
const TAIL_HEIGHT = 20;
const TAIL_HALF_WIDTH = 12.5;
const TAIL_DEPTH = 14.8;
const TAIL_CENTER = TAIL_WIDTH / 2;
const TAIL_BASE_Y = STROKE_WIDTH / 2;
const TAIL_TIP_Y = TAIL_BASE_Y + TAIL_DEPTH;
const TAIL_LEFT = TAIL_CENTER - TAIL_HALF_WIDTH;
const TAIL_RIGHT = TAIL_CENTER + TAIL_HALF_WIDTH;

interface DialogueBubbleProps {
  children: ReactNode;
  /** "down" (tail hangs off the bottom edge) or "up" (off the top edge). */
  tail?: "down" | "up";
  /** Where along that edge the tail sits — centered, or tucked in near one
   * end (just past the rounded corner) for a bubble whose speaker stands off
   * to that side. */
  tailAlign?: "left" | "center" | "right";
  /** Corner radius in px — smaller, tighter bubbles want less. */
  radius?: number;
  /** Goes on the outer wrapper — the bubble's positioning/sizing (`max-w-*`,
   * `absolute`, `invisible`, an entrance animation…). Also where a
   * dark-mode caller sets `--bubble-fill`. */
  className?: string;
  /** Goes on the box itself — its padding and text styling. */
  contentClassName?: string;
}

/**
 * The app's one speech-bubble shape, drawn to match `dialogue-box.png` but
 * built from a real box rather than the image itself, so it sizes to its
 * content instead of stretching a fixed-ratio bitmap: the rounded, outlined
 * box is plain CSS and grows/shrinks (and wraps) with whatever's inside, the
 * tail is a small fixed-size SVG stuck onto its bottom (or top) edge, and the
 * flat drop-shadow is a single zero-blur `drop-shadow` on the wrapper — a
 * filter rather than a `box-shadow` so it follows the tail's notch as well as
 * the box.
 *
 * The tail is drawn *over* the box's border: a fill-colored patch erases the
 * border segment between the tail's legs, and the tail's own outline picks
 * the stroke back up from there, so the notch reads as one continuous
 * outline. For `tail="up"` only the tail flips — the shadow stays underneath
 * the box, like a light from above, rather than moving to the top edge.
 *
 * The tail (~16px past the box's edge) and the shadow (3px below it) both
 * overhang the wrapper — they take no layout space — so a caller that needs
 * the bubble's own box to include them should pad the wrapper itself
 * (`pt-4`/`pb-4` on the tail's side, `pb-[3px]` for the shadow).
 */
export function DialogueBubble({
  children,
  tail = "down",
  tailAlign = "center",
  radius = DEFAULT_RADIUS,
  className,
  contentClassName,
}: DialogueBubbleProps) {
  const up = tail === "up";

  // Off-center tails sit just past the rounded corner (so the notch lands on
  // the box's flat edge, not on the curve). The SVG is positioned against the
  // padding box — inside the border — hence the border-width and notch-inset
  // adjustments on top of the radius.
  const tailInset = `calc(${radius}px - ${TAIL_LEFT + STROKE_WIDTH - 2}px)`;
  const tailPosition =
    tailAlign === "left"
      ? { left: tailInset }
      : tailAlign === "right"
        ? { right: tailInset }
        : undefined;

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ filter: `drop-shadow(0 ${SHADOW_OFFSET}px 0 ${SHADOW_COLOR})` }}
    >
      <div
        className={`relative ${contentClassName ?? ""}`}
        style={{
          backgroundColor: FILL,
          border: `${STROKE_WIDTH}px solid ${STROKE_COLOR}`,
          borderRadius: radius,
          // Keeps the tail on the flat part of the edge even for a very
          // short line, where the box would otherwise be narrower than its
          // own two corners plus the notch.
          minWidth: radius * 2 + TAIL_WIDTH,
        }}
      >
        {children}

        {/* Positioned against the box's padding edge, i.e. right on the inner
            side of its border — where the tail's y=0 is defined to be. */}
        <svg
          aria-hidden
          width={TAIL_WIDTH}
          height={TAIL_HEIGHT}
          viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}
          className={`absolute overflow-visible ${
            tailAlign === "center" ? "left-1/2 -translate-x-1/2" : ""
          } ${up ? "bottom-full scale-y-[-1]" : "top-full"}`}
          style={tailPosition}
        >
          {/* Erases the border between the tail's legs (and the sliver of
              it just inside them), leaving the notch open to the box. */}
          <polygon
            style={{ fill: FILL }}
            points={`${TAIL_LEFT},-1 ${TAIL_LEFT},${TAIL_BASE_Y} ${TAIL_CENTER},${TAIL_TIP_Y} ${TAIL_RIGHT},${TAIL_BASE_Y} ${TAIL_RIGHT},-1`}
          />
          {/* The V itself, with a short run of border on either side so its
              outline joins the box's border with no seam. */}
          <path
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinejoin="miter"
            d={`M0 ${TAIL_BASE_Y}H${TAIL_LEFT}L${TAIL_CENTER} ${TAIL_TIP_Y}L${TAIL_RIGHT} ${TAIL_BASE_Y}H${TAIL_WIDTH}`}
          />
        </svg>
      </div>
    </div>
  );
}
