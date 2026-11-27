import { Alignment, EventType, Fit, Layout, Rive } from "@rive-app/canvas";
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
/**
 * Words for a scene's artboard: its text runs have no names, so each is changed by its place in the artboard (see
 * `STRINGS_LIST_TEXT`). Every run a screen does not name is as the file has it.
 */
export type SceneTexts = Readonly<Record<number, string>>;

/** The part of the artboard's own object this uses (the library keeps it private). */
type TextRuns = { textValueRunCount(): number; textValueRunByIndex(index: number): { text: string } | undefined };
export type SceneTrigger = "correct" | "wrong" | "run" | "celebrate";

/**
 * What plays as a stage opens (see `playSceneIntro`). `trigger` is fired on the state machine. `lap` is one of the artboard's own
 * animations that the machine has looping all the time (the sorting lab's belt, `SL_Belt`): it plays a single lap from the same frame,
 * then holds its first frame, so the belt moves with the intro and then stands still.
 */
export type SceneIntro = { trigger?: SceneTrigger; lap?: string };

/** The part of an animation the host drives by hand for a `lap` (the library keeps the animator private). */
type LapAnimation = { name: string; time: number; apply(mix: number): void; animation: { duration: number; fps: number } };
type Lap = { animation: LapAnimation; seconds: number; elapsed: number };

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
  /** The artboard's words as the file has them (by place, see `SceneTexts`), and the ones the screen last asked for. */
  defaultTexts: string[];
  wantedTexts: SceneTexts;
  /** Things to do the moment the scene is shown (see `fireSceneTrigger`). */
  afterSettle: (() => void)[];
  /** Triggers to fire, one at a time. */
  queue: SceneTrigger[];
  firing: boolean;
  /** The intro a screen asked for (see `playSceneIntro`), until the machine has settled and it can start. */
  pending: SceneIntro | null;
  /** The animation being played one lap and then held (see `SceneIntro`). It is applied after the state machine on every frame, as the machine would otherwise put it back. */
  lap: Lap | null;
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
  applyTexts(host);
};

/** The artboard's own object, if the file has loaded. */
const textRuns = (host: Host) => (host.rive as unknown as { artboard?: TextRuns | null } | null)?.artboard ?? null;

const readTexts = (host: Host) => {
  const artboard = textRuns(host);
  if (!artboard) return;
  host.defaultTexts = Array.from({ length: artboard.textValueRunCount() }, (_, index) => artboard.textValueRunByIndex(index)?.text ?? "");
};

/** Writes the artboard's words: what the screen asked for, and the file's own for every other run (so a word a screen before changed is put back). */
const applyTexts = (host: Host) => {
  const artboard = textRuns(host);
  if (!artboard) return;
  host.defaultTexts.forEach((original, index) => {
    const run = artboard.textValueRunByIndex(index);
    const wanted = host.wantedTexts[index] ?? original;
    if (run && run.text !== wanted) run.text = wanted;
  });
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

/** Fires a trigger on the state machine now, and holds the next one back for a moment. */
const fire = (host: Host, name: SceneTrigger) => {
  host.rive?.viewModelInstance?.trigger(name)?.trigger();
  host.firing = true;
  window.setTimeout(() => {
    host.firing = false;
    drain(host);
  }, TRIGGER_GAP_MS);
};

const drain = (host: Host) => {
  if (!host.settled || host.firing) return;
  const name = host.queue.shift();
  if (name) fire(host, name);
};

/**
 * Plays `name` one lap beside the state machine, from now. The machine has it looping underneath and writes it on every frame (a
 * linear animation played the usual way is applied before the machine, so it is overwritten and nothing shows), so it is applied by
 * hand after the machine on every frame instead (see `createHost`), and kept applied once the lap is over, at its first frame.
 */
const startLap = (host: Host, name: string) => {
  const rive = host.rive;
  if (!rive) return;
  // Made by the library's animator, then paused so it does not also play the usual way.
  rive.play(name);
  rive.pause(name);
  const animator = (rive as unknown as { animator?: { animations: LapAnimation[] } }).animator;
  const animation = animator?.animations.find((candidate) => candidate.name === name);
  if (!animation) return;
  host.lap = { animation, seconds: animation.animation.duration / animation.animation.fps, elapsed: 0 };
};

/** Starts the intro a screen asked for, once the machine has settled: the trigger and the lap go out in the same tick, so they start on the same frame. */
const startIntro = (host: Host) => {
  const intro = host.pending;
  if (!intro || !host.rive || !host.settled) return;
  host.pending = null;
  host.lap = null;
  if (intro.lap) startLap(host, intro.lap);
  if (intro.trigger) fire(host, intro.trigger);
};

const createHost = (scene: DatatypesSceneName): Host => {
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity 300ms";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const host: Host = { element, rive: null, loaded: false, settled: false, defaults: {}, wanted: {}, defaultTexts: [], wantedTexts: {}, queue: [], firing: false, pending: null, lap: null, slots: 0, parked: undefined };
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
    readTexts(host);
    apply(host);
    // Shown once the machine has settled on what was asked for, so the scene never opens on its first picture.
    window.setTimeout(() => {
      host.settled = true;
      // Started as the scene fades in, so what first appears is the intro's first frames.
      startIntro(host);
      element.style.opacity = "1";
      const waiting = host.afterSettle;
      host.afterSettle = [];
      waiting.forEach((run) => run());
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
  // After the state machine has written its frame: the lap's animation is written over it, and the artboard brought up to date (a node's turn only shows once it has advanced).
  host.rive.on(EventType.Advance, (event) => {
    const lap = host.lap;
    if (!lap) return;
    lap.elapsed += event.data as number;
    lap.animation.time = lap.elapsed < lap.seconds ? lap.elapsed : 0;
    lap.animation.apply(1);
    (host.rive as unknown as { artboard?: { advance(seconds: number): void } | null } | null)?.artboard?.advance(0);
  });
  return host;
};

const getHost = (scene: DatatypesSceneName): Host => (hosts[scene] ??= createHost(scene));

/** Moves the scene into `slot` (which it fills) and draws it; undo with `detachScene`. */
export const attachScene = (scene: DatatypesSceneName, slot: HTMLElement) => {
  const host = getHost(scene);
  window.clearTimeout(host.parked);
  // A screen that comes after one with an intro starts clean: no lap held over from it.
  host.lap = null;
  host.pending = null;
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
 * is written as soon as it has. `texts` is the same for the artboard's words (see `SceneTexts`).
 */
export const showScene = (scene: DatatypesSceneName, values: SceneValues, texts: SceneTexts = {}) => {
  const host = getHost(scene);
  host.wanted = values;
  host.wantedTexts = texts;
  if (host.loaded) apply(host);
};

/**
 * Plays a stage's intro (see `SceneIntro`) as its scene shows. Safe to call before the scene has loaded: it starts as soon as
 * the machine has settled.
 */
export const playSceneIntro = (scene: DatatypesSceneName, intro: SceneIntro) => {
  const host = getHost(scene);
  host.pending = intro;
  startIntro(host);
};

/** Fires a trigger on the scene, once its machine has settled. */
export const fireSceneTrigger = (scene: DatatypesSceneName, trigger: SceneTrigger) => {
  const host = getHost(scene);
  let cancelled = false;
  let timer: number | undefined;
  const fire = () => {
    if (cancelled) return;
    host.queue.push(trigger);
    drain(host);
  };
  const start = () => {
    if (cancelled) return;
    if (delayMs > 0) timer = window.setTimeout(fire, delayMs);
    else fire();
  };
  if (host.settled) start();
  else host.afterSettle.push(start);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
};
