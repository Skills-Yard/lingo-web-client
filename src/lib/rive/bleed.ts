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
export const applyCanvasBleed = (rive: Rive, canvas: HTMLCanvasElement, bleed: number): (() => void) => {
  const resizeToCanvas = rive.resizeToCanvas.bind(rive);
  const applyFrame = () => {
    const { width, height, clientWidth } = canvas;
    if (!clientWidth) return;
    const pad = bleed * (width / clientWidth);
    Object.assign(rive, {
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
        minX: pad,
        minY: pad,
        maxX: width - pad,
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
