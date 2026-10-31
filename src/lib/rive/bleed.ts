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

type ArtboardSize = { width: number; height: number };

/**
 * The box a canvas takes in its slot when it reaches `bleed` artboard units past
 * the slot on every side (the slot being exactly the artboard's size). In
 * percentages of the slot, so it follows the slot however it is sized or squeezed.
 */
export const artboardBleedBox = ({ width, height }: ArtboardSize, bleed: number) => {
  const bleedX = (bleed / width) * 100;
  const bleedY = (bleed / height) * 100;
  return { left: `${-bleedX}%`, top: `${-bleedY}%`, width: `${100 + 2 * bleedX}%`, height: `${100 + 2 * bleedY}%` };
};

/**
 * `applyCanvasBleed` for a canvas shaped by `artboardBleedBox`: the artboard is
 * pinned to the slot in the middle of it — `Contain`ed there, or squeezed to it
 * when `fit` says `Fill` — and the `bleed` ring around it is left free for
 * whatever the artboard draws past its edge. The frame is re-applied after every
 * resize (Rive resets it to the whole canvas), and calling `resizeToCanvas()`
 * re-applies it after a change of `fit`. Returns the cleanup.
 */
export const applyArtboardBleed = (
  rive: Rive,
  canvas: HTMLCanvasElement,
  artboard: ArtboardSize,
  bleed: number,
  fit: () => Fit = () => Fit.Contain,
): (() => void) => {
  const resizeToCanvas = rive.resizeToCanvas.bind(rive);
  const applyFrame = () => {
    const { width, height } = canvas;
    // An unsized canvas (not in the page yet) has no frame to set; and a layout
    // with a zero `maxX` / `maxY` makes Rive call `resizeToCanvas()` again.
    if (!width || !height) return;
    const marginX = (width * bleed) / (artboard.width + 2 * bleed);
    const marginY = (height * bleed) / (artboard.height + 2 * bleed);
    rive.layout = rive.layout.copyWith({
      fit: fit(),
      alignment: Alignment.Center,
      minX: marginX,
      minY: marginY,
      maxX: width - marginX,
      maxY: height - marginY,
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
