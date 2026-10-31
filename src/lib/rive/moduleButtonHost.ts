import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { BUTTON, configureRiveRuntime, MODULE_BUTTON } from "./runtime";
import { writeButtonStyle } from "./buttonStyle";
import { applyArtboardBleed, artboardBleedBox } from "./bleed";

/**
 * One module button for the whole session, like the battery (see
 * `batteryHost`): every module screen mounts its own button, so a canvas made
 * per button would reload on each screen change and show something else before
 * the real art. The canvas lives here and each screen's button just moves it
 * into its slot and writes its own data (label and state). The slot is exactly
 * the artboard's size; the canvas reaches `BUTTON.bleed` units past it on every
 * side, so what the art draws outside the artboard isn't clipped.
 */
type Host = {
  element: HTMLDivElement;
  rive: Rive | null;
  loaded: boolean;
};

export type ModuleButtonData = { label: string; state: number };

let host: Host | null = null;

/** What the artboard should show; applied as soon as it has loaded. */
let wanted: ModuleButtonData | null = null;
/** Whether the artwork fills its slot (squeezed to it) rather than fitting inside it. */
let stretched = false;
let shineQueued = false;
let revealQueued = false;

/** While held, the screens' buttons take no clicks (see `moduleButtonHeld`); the
 * artboard keeps drawing `wanted` as it is. */
let held = false;
let holdTimer: ReturnType<typeof setTimeout> | undefined;
const holdListeners = new Set<() => void>();

const fireTrigger = (rive: Rive, name: string) => rive.viewModelInstance?.trigger(name)?.trigger();

/** Hidden until the canvas has painted `wanted` itself: on load Rive paints the
 * artboard's own default text first, which would flash. */
const reveal = ({ element }: Host) => {
  if (revealQueued) return;
  revealQueued = true;
  // drawFrame() paints on the next animation frame, so reveal after it.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      element.style.opacity = "1";
    }),
  );
};

const apply = (loadedHost: Host, rive: Rive) => {
  const instance = rive.viewModelInstance;
  if (!instance || !wanted) return;
  writeButtonStyle(instance, BUTTON.style.module);
  const label = instance.string(BUTTON.labelProperty);
  if (label) label.value = wanted.label;
  const state = instance.number(MODULE_BUTTON.stateProperty);
  if (state) state.value = wanted.state;
  // Nothing is animating when only the data changes, so redraw explicitly.
  rive.drawFrame();
  reveal(loadedHost);
};

/** Browser only. Creates the canvas and starts loading on first use. */
export const getModuleButtonHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:relative;width:100%;height:100%;opacity:0";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;display:block";
  Object.assign(canvas.style, artboardBleedBox(BUTTON, BUTTON.bleed));
  element.appendChild(canvas);
  const created: Host = { element, rive: null, loaded: false };
  host = created;
  created.rive = new Rive({
    src: BUTTON.src,
    canvas,
    artboard: BUTTON.artboard,
    stateMachine: BUTTON.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: stretched ? Fit.Fill : Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
      applyArtboardBleed(rive, canvas, BUTTON, BUTTON.bleed, () => (stretched ? Fit.Fill : Fit.Contain));
      rive.resizeDrawingSurfaceToCanvas();
      created.loaded = true;
      apply(created, rive);
      if (shineQueued) {
        shineQueued = false;
        fireTrigger(rive, BUTTON.shineTrigger);
      }
    },
  });
  return created;
};

/** Makes the artwork fill its slot (`true`) or fit inside it. Safe to call before the file has loaded. */
export const setModuleButtonStretch = (next: boolean) => {
  stretched = next;
  if (host?.loaded && host.rive) host.rive.resizeToCanvas();
};

/** Sets the button's label and `buttonState` (the module look is set with them). */
export const writeModuleButton = (next: ModuleButtonData) => {
  wanted = next;
  if (host?.loaded && host.rive) apply(host, host.rive);
};

export const subscribeModuleButtonHold = (listener: () => void) => {
  holdListeners.add(listener);
  return () => {
    holdListeners.delete(listener);
  };
};
export const moduleButtonHeld = () => held;

const setHeld = (next: boolean) => {
  if (held === next) return;
  held = next;
  holdListeners.forEach((listener) => listener());
};

/** Holds the button for `ms`: it takes no clicks, and looks as it did. */
export const holdModuleButton = (ms: number) => {
  clearTimeout(holdTimer);
  setHeld(true);
  holdTimer = setTimeout(() => setHeld(false), ms);
};

/** Ends the hold now. */
export const releaseModuleButton = () => {
  clearTimeout(holdTimer);
  setHeld(false);
};

/** Plays the `shine` trigger — held back until the file has loaded. */
export const sweepModuleButtonShine = () => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, BUTTON.shineTrigger);
  else shineQueued = true;
};

/** Plays the `electric` trigger — dropped until the file has loaded, since a late
 * one would play after the strike it goes with is long over. */
export const electrifyModuleButton = () => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, BUTTON.electricTrigger);
};

/** Plays the `click` trigger (the press). */
export const pressModuleButton = () => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, BUTTON.clickTrigger);
};
