import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { BUTTON, configureRiveRuntime, PROGRESS_BAR } from "./runtime";

/**
 * One progress bar for the whole session. Every screen mounts its own header,
 * so a bar created per header would reload and flash on each screen change.
 * Instead the canvas (and its Rive instance) lives here, and each header just
 * moves it into its own slot — it never restarts, so it only ever animates.
 *
 * Rive clips what it draws at the canvas edge, and the strikes reach well past
 * the artboard. So the canvas is as big as the screen, not the slot: it hangs
 * from the slot out to the screen's edges, and the artboard is drawn in the
 * slot's place on it, at the artboard's own proportions. At the bottom it stops
 * a button artboard's height short, so nothing is drawn over the Continue button.
 */
const FALLBACK_ASPECT = 8;

type Host = {
  element: HTMLDivElement;
  canvas: HTMLCanvasElement;
  rive: Rive | null;
  aspect: number;
  loaded: boolean;
  /** The slot the canvas is in now. */
  slot: HTMLElement | null;
};

/** The slot on the canvas, in the canvas's CSS px. */
type Placement = { x: number; y: number; width: number; height: number };

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

let placement: Placement | null = null;
/** The canvas's CSS size when its bitmap was last sized to it. */
let canvasSize = "";

/** Draws the artboard in the slot's place on the canvas. Rive resets its frame to
 * the whole canvas on every resize, so this is put back after each one. */
const applyFrame = () => {
  const rive = host?.rive;
  const canvas = host?.canvas;
  if (!rive || !canvas || !placement || !canvas.clientWidth) return;
  const pixels = canvas.width / canvas.clientWidth;
  Object.assign(rive, {
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
      minX: placement.x * pixels,
      minY: placement.y * pixels,
      maxX: (placement.x + placement.width) * pixels,
      maxY: (placement.y + placement.height) * pixels,
    }),
  });
};

/** Sizes the canvas to the screen less the button's room at the bottom, hung from the slot, and points the artboard at the slot. */
const placeCanvas = () => {
  const current = host;
  const slot = current?.slot;
  if (!current || !slot) return;
  const rect = slot.getBoundingClientRect();
  // The module's stage is scaled as one piece: `rect` is on screen, the canvas's CSS px are the stage's.
  const scale = slot.offsetWidth ? rect.width / slot.offsetWidth : 1;
  if (!scale) return;
  placement = { x: rect.left / scale, y: rect.top / scale, width: rect.width / scale, height: rect.height / scale };
  const size = { width: `${window.innerWidth / scale}px`, height: `${window.innerHeight / scale - BUTTON.height}px` };
  Object.assign(current.canvas.style, { left: `${-placement.x}px`, top: `${-placement.y}px`, ...size });
  // Only a new canvas size needs a new bitmap (it clears the canvas); moving the slot just moves the frame.
  const sized = `${size.width} ${size.height}`;
  if (sized !== canvasSize) {
    canvasSize = sized;
    current.rive?.resizeDrawingSurfaceToCanvas();
  }
  applyFrame();
};

/**
 * Moves the bar into `slot` and keeps the canvas fitted to it. The slot can move
 * or scale without its own size changing (the stage scales, screens slide in),
 * so it is checked every frame and the canvas only redone when it has changed.
 * Returns the cleanup.
 */
export const attachProgressBar = (slot: HTMLElement): (() => void) => {
  const shared = getProgressBarHost();
  slot.appendChild(shared.element);
  shared.slot = slot;
  let frame = 0;
  let last = "";
  const track = () => {
    const rect = slot.getBoundingClientRect();
    const key = [rect.left, rect.top, rect.width, rect.height, slot.offsetWidth, window.innerWidth, window.innerHeight].join();
    if (key !== last) {
      last = key;
      placeCanvas();
    }
    frame = requestAnimationFrame(track);
  };
  track();
  return () => {
    cancelAnimationFrame(frame);
    if (shared.slot === slot) shared.slot = null;
  };
};

/** Browser only. Creates the canvas and starts loading on first use. */
export const getProgressBarHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:relative;width:100%;height:100%;pointer-events:none";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;display:block;pointer-events:none";
  element.appendChild(canvas);
  const created: Host = { element, canvas, rive: null, aspect: FALLBACK_ASPECT, loaded: false, slot: null };
  host = created;
  created.rive = new Rive({
    src: PROGRESS_BAR.src,
    canvas,
    artboard: PROGRESS_BAR.artboard,
    stateMachine: PROGRESS_BAR.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
      const resizeToCanvas = rive.resizeToCanvas.bind(rive);
      Object.assign(rive, {
        resizeToCanvas: () => {
          resizeToCanvas();
          applyFrame();
        },
      });
      canvasSize = "";
      placeCanvas();
      writeScreenHeight();
      const { minX, maxX, minY, maxY } = rive.bounds;
      if (maxY > minY) created.aspect = (maxX - minX) / (maxY - minY);
      created.loaded = true;
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[progress bar] view model properties:",
          rive.defaultViewModel()?.properties.map((property) => `${property.name}:${property.type}`),
        );
      }
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

const writeCombo = (combo: number) => {
  const property = host?.rive?.viewModelInstance?.number(PROGRESS_BAR.comboProperty);
  if (property) property.value = combo;
};

/** Sets `screenH` to -1. The bar is shared by every screen, so once on load covers them all. */
const writeScreenHeight = () => {
  const property = host?.rive?.viewModelInstance?.number(PROGRESS_BAR.screenHeightProperty);
  if (property) property.value = PROGRESS_BAR.screenHeightValue;
  else console.warn(`[progress bar] no "${PROGRESS_BAR.screenHeightProperty}" number found on the view model`);
};

let comboTimer: ReturnType<typeof setTimeout> | undefined;

/** Sets `combo` to 3 when the fill changes, then back to 0 after 1s. */
export const pulseCombo = () => {
  clearTimeout(comboTimer);
  writeCombo(PROGRESS_BAR.comboValue);
  comboTimer = setTimeout(() => writeCombo(0), PROGRESS_BAR.comboHoldMs);
};

/** Fires the view model's trigger `name` — dropped until the file has loaded. */
export const fireProgressTrigger = (name: string) => {
  if (!host?.loaded) return;
  const trigger = host.rive?.viewModelInstance?.trigger(name);
  if (trigger) trigger.trigger();
  else console.warn(`[progress bar] no "${name}" trigger found on the view model`);
};

const RESULT_NAME = { correct: /correct|right|success|win/i, wrong: /wrong|incorrect|fail|lose|error/i } as const;

/** Plays the bar's reaction to a checked answer. Looks on the view model for a
 * trigger (or flag) named for the result (`correct` / `wrong`). */
export const fireAnswer = (correct: boolean) => {
  const rive = host?.rive;
  if (!rive) return;
  const exact = correct ? PROGRESS_BAR.correctTrigger : PROGRESS_BAR.wrongTrigger;
  const pattern = correct ? RESULT_NAME.correct : RESULT_NAME.wrong;
  const matches = (name: string) => name === exact || (pattern.test(name) && !(correct && RESULT_NAME.wrong.test(name)));

  const properties = rive.defaultViewModel()?.properties ?? [];
  const property = properties.find((candidate) => matches(candidate.name));
  const instance = rive.viewModelInstance;
  if (property && instance) {
    const trigger = instance.trigger(property.name);
    if (trigger) {
      trigger.trigger();
      if (process.env.NODE_ENV !== "production") console.info(`[progress bar] fired "${property.name}"`);
      return;
    }
    const flag = instance.boolean(property.name);
    if (flag) {
      flag.value = true;
      return;
    }
  }
  console.warn(`[progress bar] no "${exact}" trigger found on the view model`);
};
