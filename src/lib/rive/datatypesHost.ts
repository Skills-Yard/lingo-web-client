import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { configureRiveRuntime, DATATYPES_SCENES, type DatatypesSceneName } from "./runtime";
import { riveSource } from "./riveCache";

/**
 * The Data Types module's scenes (see `DATATYPES_SCENES`), one canvas each, kept for
 * the whole module like the Sequence room (see `roomHost`): every screen is its own
 * page, so a scene made per screen would load and start over on each step. The canvas
 * lives here and each screen's slot just moves it in. A scene is made the first time a
 * screen asks for it, and stops drawing while no screen shows it.
 */
export type { DatatypesSceneName };

export type SceneValue = boolean | number | string;
/** Data for a scene's artboard, by name (see `DATATYPES_SCENES`). */
export type SceneValues = Readonly<Record<string, SceneValue>>;
export type SceneTrigger = "correct" | "wrong" | "run";

type Host = {
  element: HTMLDivElement;
  rive: Rive | null;
  loaded: boolean;
  /** The state machine has had time to settle after loading, so it takes triggers. */
  settled: boolean;
  /** What the file has when it is made, so a screen that names less than the last one gets a clean scene. */
  defaults: Record<string, SceneValue>;
  /** What the screen last asked for. */
  wanted: SceneValues;
  /** Triggers to fire, one at a time. */
  queue: SceneTrigger[];
  firing: boolean;
  /** How many slots show it right now, and the timer that stops its drawing once none does. */
  slots: number;
  parked: number | undefined;
};

/** A trigger fired the moment the file loads is dropped (the machine is still entering its first state). */
const SETTLE_MS = 600;
/** Two triggers fired in the same frame are not both taken, so each goes out this long after the last. */
const TRIGGER_GAP_MS = 150;
/** A scene no screen shows keeps drawing this long (a screen change takes less) before it stops. */
const PARK_MS = 1500;

const LAYOUT = () => new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter });

const hosts: Partial<Record<DatatypesSceneName, Host>> = {};

const write = (host: Host, name: string, value: SceneValue) => {
  const instance = host.rive?.viewModelInstance;
  if (!instance) return;
  if (typeof value === "boolean") {
    const property = instance.boolean(name);
    if (property) property.value = value;
  } else if (typeof value === "number") {
    const property = instance.number(name);
    if (property) property.value = value;
  } else {
    const property = instance.string(name);
    if (property) property.value = value;
  }
};

/** Writes the scene's data: everything the file has, as it is made, then what the screen asked for over it. */
const apply = (host: Host) => {
  Object.entries(host.defaults).forEach(([name, value]) => {
    if (!(name in host.wanted)) write(host, name, value);
  });
  Object.entries(host.wanted).forEach(([name, value]) => write(host, name, value));
};

const readDefaults = (host: Host) => {
  const instance = host.rive?.viewModelInstance;
  if (!instance) return;
  instance.properties.forEach(({ name, type }) => {
    if (type === "number") host.defaults[name] = instance.number(name)?.value ?? 0;
    else if (type === "boolean") host.defaults[name] = instance.boolean(name)?.value ?? false;
    else if (type === "string") host.defaults[name] = instance.string(name)?.value ?? "";
  });
};

const drain = (host: Host) => {
  if (!host.settled || host.firing) return;
  const name = host.queue.shift();
  if (!name) return;
  host.rive?.viewModelInstance?.trigger(name)?.trigger();
  host.firing = true;
  window.setTimeout(() => {
    host.firing = false;
    drain(host);
  }, TRIGGER_GAP_MS);
};

const createHost = (scene: DatatypesSceneName): Host => {
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity 300ms";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const host: Host = { element, rive: null, loaded: false, settled: false, defaults: {}, wanted: {}, queue: [], firing: false, slots: 0, parked: undefined };
  // A cached file can finish loading before `new Rive` has returned, so wait for the instance.
  const onLoad = () => {
    const rive = host.rive;
    if (!rive) {
      queueMicrotask(onLoad);
      return;
    }
    host.loaded = true;
    rive.resizeDrawingSurfaceToCanvas();
    Object.assign(rive, { layout: LAYOUT() });
    readDefaults(host);
    apply(host);
    // Shown once the machine has settled on what was asked for, so the scene never opens on its first picture.
    window.setTimeout(() => {
      host.settled = true;
      element.style.opacity = "1";
      drain(host);
    }, SETTLE_MS);
  };
  host.rive = new Rive({
    ...riveSource(DATATYPES_SCENES.src),
    canvas,
    artboard: DATATYPES_SCENES[scene].artboard,
    stateMachine: DATATYPES_SCENES[scene].stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT(),
    onLoad,
  });
  return host;
};

const getHost = (scene: DatatypesSceneName): Host => (hosts[scene] ??= createHost(scene));

/** Moves the scene into `slot` (which it fills) and draws it; undo with `detachScene`. */
export const attachScene = (scene: DatatypesSceneName, slot: HTMLElement) => {
  const host = getHost(scene);
  window.clearTimeout(host.parked);
  host.slots += 1;
  slot.appendChild(host.element);
  host.rive?.startRendering();
  host.rive?.resizeDrawingSurfaceToCanvas();
  return host;
};

export const detachScene = (scene: DatatypesSceneName) => {
  const host = hosts[scene];
  if (!host) return;
  host.slots = Math.max(0, host.slots - 1);
  if (host.slots > 0) return;
  host.parked = window.setTimeout(() => host.rive?.stopRendering(), PARK_MS);
};

/**
 * Says what the scene shows: `values` is all the data the screen sets, and every other value goes back to what
 * the file has (so a highlight a screen before left on is cleared). Safe to call before the file has loaded: it
 * is written as soon as it has.
 */
export const showScene = (scene: DatatypesSceneName, values: SceneValues) => {
  const host = getHost(scene);
  host.wanted = values;
  if (host.loaded) apply(host);
};

/** Fires a trigger on the scene, once its machine has settled. */
export const fireSceneTrigger = (scene: DatatypesSceneName, trigger: SceneTrigger) => {
  const host = getHost(scene);
  host.queue.push(trigger);
  drain(host);
};
