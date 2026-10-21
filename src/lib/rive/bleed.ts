import { Alignment, Fit, Layout, type Rive } from "@rive-app/canvas";

/**
 * Rive clips what it draws at the canvas edge, not at the artboard's, so
 * anything an animation puts outside the artboard (glows, sparks) shows only
 * if the canvas has spare room around it.
 *
 * Call this for a canvas that is `bleed` CSS px bigger than the slot on every
 * side: the artboard `Contain`s in the middle, and the `bleed` ring around it
 * is left free for those extras. Rive resets its frame to the whole canvas on
 * every resize, so it is put back after each one. Returns the cleanup.
 */
export const applyCanvasBleed = (
  rive: Rive,
  canvas: HTMLCanvasElement,
  bleed: number,
  /** Artboard px the content starts in from the artboard's left edge; the
   * artboard is drawn that far to the left, so the content fills the slot. */
  contentInset = 0,
): (() => void) => {
  const resizeToCanvas = rive.resizeToCanvas.bind(rive);
  const applyFrame = () => {
    const { width, height, clientWidth } = canvas;
    if (!clientWidth) return;
    const pad = bleed * (width / clientWidth);
    const { minX, maxX } = rive.bounds;
    const scale = (width - 2 * pad) / (maxX - minX);
    const left = pad - contentInset * scale;
    Object.assign(rive, {
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.TopLeft,
        minX: left,
        minY: pad,
        maxX: left + width - 2 * pad,
        maxY: height - pad,
      }),
    });
  };
  Object.assign(rive, {
    resizeToCanvas: () => {
      resizeToCanvas();
      applyFrame();
    },
  });
  applyFrame();
  return () => {
    Object.assign(rive, { resizeToCanvas });
  };
};
