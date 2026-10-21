import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { hexRiveSource } from "./hexFile";
import { configureRiveRuntime, PROGRESS_BAR } from "./runtime";

/**
 * One progress bar for the whole session. Every screen mounts its own header,
 * so a bar created per header would reload and flash on each screen change.
 * Instead the canvas (and its Rive instance) lives here, and each header just
 * moves it into its own slot — it never restarts, so it only ever animates.
 */
const FALLBACK_ASPECT = 8;

type Host = {
  element: HTMLDivElement;
  canvas: HTMLCanvasElement;
  rive: Rive | null;
  aspect: number;
  loaded: boolean;
};

let host: Host | null = null;
let version = 0;
const listeners = new Set<() => void>();

const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export const subscribeProgressBar = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const progressBarVersion = () => version;

/** Browser only. Creates the canvas and starts loading on first use. */
export const getProgressBarHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "width:100%;height:100%";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const created: Host = { element, canvas, rive: null, aspect: FALLBACK_ASPECT, loaded: false };
  host = created;
  created.rive = new Rive({
    ...hexRiveSource(),
    canvas,
    artboard: PROGRESS_BAR.artboard,
    stateMachines: PROGRESS_BAR.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
      rive.resizeDrawingSurfaceToCanvas();
      const { minX, maxX, minY, maxY } = rive.bounds;
      if (maxY > minY) created.aspect = (maxX - minX) / (maxY - minY);
      created.loaded = true;
      notify();
    },
  });
  return created;
};

/** The fill last written, so the next screen tweens from it. */
let shownFill: number | null = null;
export const lastShownFill = () => shownFill;

/** Sets the bar's `progress` (0-100). */
export const writeProgress = (fill: number) => {
  shownFill = fill;
  const property = host?.rive?.viewModelInstance?.number(PROGRESS_BAR.property);
  if (property) property.value = fill;
};
