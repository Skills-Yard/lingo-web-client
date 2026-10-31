import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { BATTERY, configureRiveRuntime } from "./runtime";

// Same as `progressBarHost`: a hot reload would leave a second, unloaded battery beside the one on screen.
import.meta.turbopackHot?.decline();

/**
 * One battery for the whole session, like the progress bar (see
 * `progressBarHost`): every screen mounts its own header, so a battery created
 * per header would reload on each screen change and lose its animation. The
 * canvas lives here and each slot just moves it in.
 */
type Host = {
  element: HTMLDivElement;
  canvas: HTMLCanvasElement;
  rive: Rive | null;
  loaded: boolean;
};

let host: Host | null = null;

/** What the artboard should show; applied as soon as it has loaded. The theme
 * is kept apart from the fill so switching it mid-session only rewrites
 * `darkTheme`. */
let wanted: { level: number; unlimited: boolean } | null = null;
let wantedDarkTheme: boolean | null = null;
/** Triggers asked for before the file had loaded, fired once it has. */
const queuedTriggers = new Set<string>();
let chargingTimer: ReturnType<typeof setTimeout> | undefined;

const fireTrigger = (rive: Rive, name: string) => rive.viewModelInstance?.trigger(name)?.trigger();

const writeCharging = (charging: boolean) => {
  const property = host?.rive?.viewModelInstance?.boolean(BATTERY.chargingProperty);
  if (property) property.value = charging;
};

const applyFill = (rive: Rive) => {
  const instance = rive.viewModelInstance;
  if (!instance || !wanted) return;
  const level = instance.number(BATTERY.levelProperty);
  if (level) level.value = wanted.level;
  const unlimited = instance.boolean(BATTERY.unlimitedProperty);
  if (unlimited) unlimited.value = wanted.unlimited;
};

const applyDarkTheme = (rive: Rive) => {
  const instance = rive.viewModelInstance;
  if (!instance || wantedDarkTheme === null) return;
  const darkTheme = instance.boolean(BATTERY.darkThemeProperty);
  if (darkTheme) darkTheme.value = wantedDarkTheme;
};

/** Matches the drawing surface to the canvas, then pins the artboard to the
 * middle of it, `bleed` artboard units in from each edge. Rive resets its frame
 * to the whole canvas on every resize, so the margin is re-applied here; and
 * `Contain` alone would stretch the artboard over the margin too. */
export const resizeBattery = () => {
  const rive = host?.rive;
  if (!host || !rive) return;
  rive.resizeDrawingSurfaceToCanvas();
  const { width, height } = host.canvas;
  const marginX = (width * BATTERY.bleed) / (BATTERY.width + 2 * BATTERY.bleed);
  const marginY = (height * BATTERY.bleed) / (BATTERY.height + 2 * BATTERY.bleed);
  rive.layout = rive.layout.copyWith({ minX: marginX, minY: marginY, maxX: width - marginX, maxY: height - marginY });
};

/** Browser only. Creates the canvas and starts loading on first use. */
export const getBatteryHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:relative;width:100%;height:100%";
  const canvas = document.createElement("canvas");
  // The slot is exactly the artboard; the canvas reaches `bleed` artboard units
  // past it on every side so the glow isn't cut at the slot's edge (see
  // `resizeBattery`, which keeps the artboard itself at the slot's size).
  const bleedX = (BATTERY.bleed / BATTERY.width) * 100;
  const bleedY = (BATTERY.bleed / BATTERY.height) * 100;
  canvas.style.cssText = `position:absolute;display:block;left:${-bleedX}%;top:${-bleedY}%;width:${100 + 2 * bleedX}%;height:${100 + 2 * bleedY}%`;
  element.appendChild(canvas);
  const created: Host = { element, canvas, rive: null, loaded: false };
  host = created;
  created.rive = new Rive({
    src: BATTERY.src,
    canvas,
    artboard: BATTERY.artboard,
    stateMachine: BATTERY.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
      resizeBattery();
      created.loaded = true;
      applyFill(rive);
      applyDarkTheme(rive);
      queuedTriggers.forEach((name) => fireTrigger(rive, name));
      queuedTriggers.clear();
    },
  });
  return created;
};

/** Sets the battery's `level` (0-100) and `unlimited`. */
export const writeBattery = (next: { level: number; unlimited: boolean }) => {
  wanted = next;
  if (host?.loaded && host.rive) applyFill(host.rive);
};

/** Sets the battery's `darkTheme` — `true` for the dark theme, `false` for
 * light. Safe to call whenever the theme changes. */
export const writeBatteryTheme = (darkTheme: boolean) => {
  wantedDarkTheme = darkTheme;
  if (host?.loaded && host.rive) applyDarkTheme(host.rive);
};

/** Fires the trigger `name` — held back until the file has loaded. */
const fireBatteryTrigger = (name: string) => {
  if (host?.loaded && host.rive) fireTrigger(host.rive, name);
  else queuedTriggers.add(name);
};

/** A screen took a unit: plays `spend`. */
export const spendBattery = () => fireBatteryTrigger(BATTERY.spendTrigger);

/** A streak gave a unit back: plays `gain` and then `fullFlash`, with `charging` on meanwhile. */
export const chargeBattery = () => {
  fireBatteryTrigger(BATTERY.gainTrigger);
  setTimeout(() => fireBatteryTrigger(BATTERY.fullFlashTrigger), BATTERY.triggerGapMs);
  clearTimeout(chargingTimer);
  writeCharging(true);
  chargingTimer = setTimeout(() => writeCharging(false), BATTERY.chargingMs);
};
