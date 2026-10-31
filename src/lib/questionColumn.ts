/** The margin (px on the screen itself) a question and its answers keep from the screen's left and right edge. */
export const SIDE_MARGIN = 25;

/** The widest the column gets on the screen (px): a big phone less the margins. On anything wider it stays this wide, centred. */
const MAX_ON_SCREEN = 380;

/**
 * The column's width as a CSS length, for the stage: the screen (`--stage-w`) less the
 * margins. The stage is drawn as a 390px frame scaled by `--stage-scale`, so what is
 * wanted in screen px is divided by it: the margin then comes out at exactly
 * `SIDE_MARGIN` on every phone, whatever its size or how far the screen was shrunk to fit.
 */
export const COLUMN_W = `min(var(--stage-w, 390px) - ${2 * SIDE_MARGIN}px / var(--stage-scale, 1), ${MAX_ON_SCREEN}px / var(--stage-scale, 1))`;
