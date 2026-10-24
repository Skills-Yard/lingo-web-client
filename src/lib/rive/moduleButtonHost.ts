import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { BUTTON, configureRiveRuntime, MODULE_BUTTON } from "./runtime";

/**
 * One module button for the whole session, like the battery (see
 * `batteryHost`): every module screen mounts its own button, so a canvas made
 * per button would reload on each screen change and show something else before
 * the real art. The canvas lives here and each screen's button just moves it
 * into its slot and writes its own data (label and state).
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
let shineQueued = false;
let revealQueued = false;

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
  canvas.style.cssText = "position:absolute;display:block;inset:0;width:100%;height:100%";
  element.appendChild(canvas);
  const created: Host = { element, rive: null, loaded: false };
  host = created;
  created.rive = new Rive({
    src: BUTTON.src,
    canvas,
    artboard: MODULE_BUTTON.artboard,
    stateMachine: MODULE_BUTTON.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
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

/** Sets the button's label and `buttonState`. */
export const writeModuleButton = (next: ModuleButtonData) => {
  wanted = next;
  if (host?.loaded && host.rive) apply(host, host.rive);
};

/** Plays the `shine` trigger — held back until the file has loaded. */
export const sweepModuleButtonShine = () => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, BUTTON.shineTrigger);
  else shineQueued = true;
};

/** Plays the `click` trigger (the press). */
export const pressModuleButton = () => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, BUTTON.clickTrigger);
};
