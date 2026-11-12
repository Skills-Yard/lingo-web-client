import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { configureRiveRuntime, VARIABLE_SCENES } from "./runtime";
import { riveSource } from "./riveCache";

/**
 * The Variable module's scenes (see `VARIABLE_SCENES`), one canvas each, kept
 * for the whole module like the Sequence room (see `roomHost`): every screen is its
 * own page, so a scene created per screen would load and start over on each step
 * (the trail's walkers back at the start, the bottle empty again). The canvas lives
 * here and each screen's slot just moves it in, so the bottle that was filled on one
 * screen is still full on the next. A scene is created the first time a screen asks
 * for it, and stops drawing while no screen shows it.
 */
export type SceneName = "trek" | "bottle" | "names" | "varCard" | "classroom" | "miniApp" | "complete" | "items" | "shop" | "wallet";

/** The bottle artboard's data. With `showVariable` it draws a variable card (a heading, `varName`, and the `level` in ml) beside the bottle, and moves the bottle over to make room. */
type BottleValues = { capOpen: boolean; level: number; pouring: boolean; showLabel: boolean; showVariable: boolean; varName: string };

/** The data each scene's artboard binds, by name. */
type SceneValues = {
  trek: { thirsty: boolean; noWater: boolean; thinking: boolean };
  bottle: BottleValues;
  names: { showLabels: boolean };
  varCard: { linked: boolean; mode: number; name1: string; name2: string; select: number; showParts: boolean; val1: string; val2: string };
  classroom: { highlight: number; present: number; showNames: boolean; total: number };
  miniApp: {
    bug: boolean;
    filled: number;
    formula: string;
    formulaFixed: string;
    highlight: number;
    mode: number;
    name1: string;
    name2: string;
    name3: string;
    result: number;
    resultName: string;
    resultUnit: string;
    showResult: boolean;
    title: string;
    val1: string;
    val2: string;
    val3: string;
  };
  complete: { focus: number };
  items: { pick: number };
  shop: { highlight: number; showEraser: boolean; showNames: boolean; showTotal: boolean; total: number };
  wallet: { amount: number; balance: number; showCard: boolean; showToy: boolean };
};

/** The triggers each scene's artboard binds. */
type SceneTriggers = {
  trek: "cheer" | "drinkHint";
  bottle: "pop";
  names: "shuffle";
  varCard: "correct" | "wrong";
  classroom: "correct" | "wrong" | "arrive";
  miniApp: "correct" | "wrong";
  complete: "celebrate";
  items: "correct" | "wrong";
  shop: "correct" | "wrong" | "calc" | "calcAll";
  wallet: "receive" | "spend";
};

type Value = boolean | number | string;

type Host = {
  element: HTMLDivElement;
  rive: Rive | null;
  loaded: boolean;
  /** The state machine has had time to settle after loading, so it takes triggers. */
  settled: boolean;
  /** What the screens last asked for, written to the file as soon as it has loaded. */
  wanted: Record<string, Value>;
  /** Things to do once the machine has settled. */
  waiting: (() => void)[];
  /** Triggers to fire, one at a time. */
  queue: string[];
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

/** A beat between the cap being open and the water moving. */
const OPEN_CAP_GAP_MS = 250;

const LAYOUT = () => new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter });

const hosts: Partial<Record<SceneName, Host>> = {};

const write = (host: Host, name: string, value: Value) => {
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

const createHost = (scene: SceneName): Host => {
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity 300ms";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const host: Host = { element, rive: null, loaded: false, settled: false, wanted: {}, waiting: [], queue: [], firing: false, slots: 0, parked: undefined };
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
    Object.entries(host.wanted).forEach(([name, value]) => write(host, name, value));
    element.style.opacity = "1";
    window.setTimeout(() => {
      host.settled = true;
      const waiting = host.waiting;
      host.waiting = [];
      waiting.forEach((run) => run());
      drain(host);
    }, SETTLE_MS);
  };
  host.rive = new Rive({
    ...riveSource(VARIABLE_SCENES.src),
    canvas,
    artboard: VARIABLE_SCENES[scene].artboard,
    stateMachine: VARIABLE_SCENES[scene].stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT(),
    onLoad,
  });
  return host;
};

const getHost = (scene: SceneName): Host => (hosts[scene] ??= createHost(scene));

/** Moves the scene into `slot` (which it fills) and draws it; undo with `detachScene`. */
export const attachScene = (scene: SceneName, slot: HTMLElement) => {
  const host = getHost(scene);
  window.clearTimeout(host.parked);
  host.slots += 1;
  slot.appendChild(host.element);
  host.rive?.startRendering();
  host.rive?.resizeDrawingSurfaceToCanvas();
  return host;
};

export const detachScene = (scene: SceneName) => {
  const host = hosts[scene];
  if (!host) return;
  host.slots = Math.max(0, host.slots - 1);
  if (host.slots > 0) return;
  host.parked = window.setTimeout(() => host.rive?.stopRendering(), PARK_MS);
};

/** Sets data on the scene. Safe to call before the file has loaded: the latest values are written as soon as it has. */
export const setSceneValues = <S extends SceneName>(scene: S, values: Partial<SceneValues[S]>) => {
  const host = getHost(scene);
  Object.entries(values).forEach(([name, value]) => {
    host.wanted[name] = value as Value;
    if (host.loaded) write(host, name, value as Value);
  });
};

/** Fires a trigger on the scene, once its machine has settled. */
export const fireSceneTrigger = <S extends SceneName>(scene: S, trigger: SceneTriggers[S]) => {
  const host = getHost(scene);
  host.queue.push(trigger);
  drain(host);
};

/** Runs `run` once the scene's machine has settled (at once if it has), for what the file would skip if it were done as it loads. */
export const whenSceneSettled = (scene: SceneName, run: () => void) => {
  const host = getHost(scene);
  if (host.settled) run();
  else host.waiting.push(run);
};

/* ───────────────────────── The bottle's water ───────────────────────── */

let level = 0;
let ramp = 0;

const writeLevel = (value: number) => {
  level = value;
  setSceneValues("bottle", { level: Math.round(value) });
};

/**
 * Opens the bottle's cap, and says how many ms until the water may start moving: the
 * cap takes `capOpenSeconds` to open (and, the first time, the machine has to settle
 * first). A bottle whose cap is already open (an earlier screen opened it) needs no wait.
 */
export const openBottleCap = (): number => {
  if (hosts.bottle?.wanted.capOpen === true) return OPEN_CAP_GAP_MS;
  whenSceneSettled("bottle", () => setSceneValues("bottle", { capOpen: true }));
  return SETTLE_MS + VARIABLE_SCENES.bottle.capOpenSeconds * 1000 + OPEN_CAP_GAP_MS;
};

/** Puts the water at `ml` at once. */
export const setBottleLevel = (ml: number) => {
  cancelAnimationFrame(ramp);
  writeLevel(ml);
};

/** Moves the water from where it is to `ml` over `ms`, easing in and out. */
export const rampBottleLevel = (ml: number, ms: number) => {
  cancelAnimationFrame(ramp);
  const from = level;
  if (ms <= 0 || from === ml) {
    writeLevel(ml);
    return;
  }
  const started = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / ms);
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    writeLevel(from + (ml - from) * eased);
    if (t < 1) ramp = requestAnimationFrame(step);
  };
  ramp = requestAnimationFrame(step);
};
