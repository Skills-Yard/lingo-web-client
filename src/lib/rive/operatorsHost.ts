import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import type { SceneTexts, SceneValue, SceneValues } from "./datatypesHost";
import { riveSource } from "./riveCache";
import { configureRiveRuntime, OPERATOR_SCENES, type OperatorSceneName } from "./runtime";

/**
 * The Operators module's scenes (see `OPERATOR_SCENES`), one canvas each, kept for the whole module like the Data
 * Types scenes (see `datatypesHost`). A stage that shows one is its own mount (and other stages do not show it), so a
 * canvas made per stage would load and start over each time. The canvas lives here and each stage's slot just moves
 * it in. A scene is made the first time a stage asks for it, and stops drawing while none shows it.
 */
export type { OperatorSceneName, SceneTexts, SceneValues };
export type SceneTrigger = "correct" | "wrong" | "calc";

/** The part of the artboard's own object this uses (the library keeps it private). */
type TextRuns = { textValueRunCount(): number; textValueRunByIndex(index: number): { text: string } | undefined };

type Host = {
  element: HTMLDivElement;
  rive: Rive | null;
  loaded: boolean;
  /** The state machine has had time to settle after loading, so it takes triggers. */
  settled: boolean;
  /** What the file has when it is made, so a stage that names less than the last one gets a clean scene. */
  defaults: Record<string, SceneValue>;
  /** What the stage last asked for. */
  wanted: SceneValues;
  /** The artboard's words as the file has them (by place, see `SceneTexts`), and the ones the stage last asked for. */
  defaultTexts: string[];
  wantedTexts: SceneTexts;
  /** The runs this host has written over (so only those are put back: a run the file binds to its data, as the studio's card is, is never touched). */
  rewritten: Set<number>;
  /** Triggers to fire, one at a time. */
  queue: SceneTrigger[];
  firing: boolean;
  /** How many slots show it right now, and the timer that stops its drawing once none does. */
  slots: number;
  parked: number | undefined;
};

/** The machine is shown once it has settled on what was asked for, so a scene never opens on its first picture. A trigger fired the moment the file loads is dropped (the machine is still entering its first state). */
const SETTLE_MS = 600;
/** Two triggers fired in the same frame are not both taken, so each goes out this long after the last. */
const TRIGGER_GAP_MS = 150;
/** A scene no stage shows keeps drawing this long (a stage change takes less) before it stops. */
const PARK_MS = 1500;

const LAYOUT = () => new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter });

const hosts: Partial<Record<OperatorSceneName, Host>> = {};

const write = (target: Host, name: string, value: SceneValue) => {
  const instance = target.rive?.viewModelInstance;
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

/** The artboard's own object, if the file has loaded. */
const textRuns = (target: Host) => (target.rive as unknown as { artboard?: TextRuns | null } | null)?.artboard ?? null;

const readTexts = (target: Host) => {
  const artboard = textRuns(target);
  if (!artboard) return;
  target.defaultTexts = Array.from({ length: artboard.textValueRunCount() }, (_, index) => artboard.textValueRunByIndex(index)?.text ?? "");
};

/**
 * Writes the artboard's words: what the stage asked for, and the file's own for a run a stage before changed (so it is put
 * back). A run nobody asked to change is left alone, since some of the file's words are bound to its data (the studio's
 * card is written through `infoTitle` and the rest), and writing a run would undo that.
 */
const applyTexts = (target: Host) => {
  const artboard = textRuns(target);
  if (!artboard) return;
  Object.entries(target.wantedTexts).forEach(([key, text]) => {
    const index = Number(key);
    const run = artboard.textValueRunByIndex(index);
    if (!run) return;
    if (run.text !== text) run.text = text;
    target.rewritten.add(index);
  });
  target.rewritten.forEach((index) => {
    if (index in target.wantedTexts) return;
    const run = artboard.textValueRunByIndex(index);
    if (run && run.text !== target.defaultTexts[index]) run.text = target.defaultTexts[index];
    target.rewritten.delete(index);
  });
};

/** Writes the scene's data: everything the file has, as it is made, then what the stage asked for over it. */
const apply = (target: Host) => {
  Object.entries(target.defaults).forEach(([name, value]) => {
    if (!(name in target.wanted)) write(target, name, value);
  });
  Object.entries(target.wanted).forEach(([name, value]) => write(target, name, value));
  applyTexts(target);
};

const readDefaults = (target: Host) => {
  const instance = target.rive?.viewModelInstance;
  if (!instance) return;
  instance.properties.forEach(({ name, type }) => {
    if (type === "number") target.defaults[name] = instance.number(name)?.value ?? 0;
    else if (type === "boolean") target.defaults[name] = instance.boolean(name)?.value ?? false;
    else if (type === "string") target.defaults[name] = instance.string(name)?.value ?? "";
  });
};

const drain = (target: Host) => {
  if (!target.settled || target.firing) return;
  const name = target.queue.shift();
  if (!name) return;
  target.rive?.viewModelInstance?.trigger(name)?.trigger();
  target.firing = true;
  window.setTimeout(() => {
    target.firing = false;
    drain(target);
  }, TRIGGER_GAP_MS);
};

const createHost = (scene: OperatorSceneName): Host => {
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity 300ms";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const created: Host = { element, rive: null, loaded: false, settled: false, defaults: {}, wanted: {}, defaultTexts: [], wantedTexts: {}, rewritten: new Set(), queue: [], firing: false, slots: 0, parked: undefined };
  // A cached file can finish loading before `new Rive` has returned, so wait for the instance.
  const onLoad = () => {
    const rive = created.rive;
    if (!rive) {
      queueMicrotask(onLoad);
      return;
    }
    created.loaded = true;
    rive.resizeDrawingSurfaceToCanvas();
    Object.assign(rive, { layout: LAYOUT() });
    readDefaults(created);
    readTexts(created);
    apply(created);
    window.setTimeout(() => {
      created.settled = true;
      element.style.opacity = "1";
      drain(created);
    }, SETTLE_MS);
  };
  created.rive = new Rive({
    ...riveSource(OPERATOR_SCENES.src),
    canvas,
    artboard: OPERATOR_SCENES[scene].artboard,
    stateMachine: OPERATOR_SCENES[scene].stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT(),
    onLoad,
  });
  return created;
};

const getHost = (scene: OperatorSceneName): Host => (hosts[scene] ??= createHost(scene));

/** Moves the scene into `slot` (which it fills) and draws it; undo with `detachScene`. */
export const attachScene = (scene: OperatorSceneName, slot: HTMLElement) => {
  const host = getHost(scene);
  window.clearTimeout(host.parked);
  host.slots += 1;
  slot.appendChild(host.element);
  host.rive?.startRendering();
  host.rive?.resizeDrawingSurfaceToCanvas();
  return host;
};

export const detachScene = (scene: OperatorSceneName) => {
  const host = hosts[scene];
  if (!host) return;
  host.slots = Math.max(0, host.slots - 1);
  if (host.slots > 0) return;
  host.parked = window.setTimeout(() => host.rive?.stopRendering(), PARK_MS);
};

/**
 * Says what the scene shows: `values` is all the data the stage sets, and every other value goes back to what the
 * file has (so a key a stage before lifted is put down). Safe to call before the file has loaded: it is written
 * as soon as it has. `texts` is the same for the artboard's words (see `SceneTexts`).
 */
export const showScene = (scene: OperatorSceneName, values: SceneValues, texts: SceneTexts = {}) => {
  const host = getHost(scene);
  host.wanted = values;
  host.wantedTexts = texts;
  if (host.loaded) apply(host);
};

/** Fires a trigger on the scene, once its machine has settled. */
export const fireScene = (scene: OperatorSceneName, trigger: SceneTrigger) => {
  const host = getHost(scene);
  host.queue.push(trigger);
  drain(host);
};
