import { Alignment, Fit, Layout, Rive, StateMachineInputType } from "@rive-app/canvas";
import { applyCanvasBleed } from "./bleed";
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
  element.style.cssText = "position:relative;width:100%;height:100%";
  const canvas = document.createElement("canvas");
  // Bigger than the slot by the bleed on every side, so effects past the artboard show.
  const { bleed } = PROGRESS_BAR;
  canvas.style.cssText = `position:absolute;display:block;left:-${bleed}px;top:-${bleed}px;width:calc(100% + ${2 * bleed}px);height:calc(100% + ${2 * bleed}px)`;
  element.appendChild(canvas);
  const created: Host = { element, canvas, rive: null, aspect: FALLBACK_ASPECT, loaded: false };
  host = created;
  created.rive = new Rive({
    ...hexRiveSource(),
    canvas,
    artboard: PROGRESS_BAR.artboard,
    stateMachine: PROGRESS_BAR.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => {
      const rive = created.rive;
      if (!rive) return;
      applyCanvasBleed(rive, canvas, bleed);
      rive.resizeDrawingSurfaceToCanvas();
      const { minX, maxX, minY, maxY } = rive.bounds;
      if (maxY > minY) created.aspect = (maxX - minX) / (maxY - minY);
      created.loaded = true;
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[progress bar] view model properties:",
          rive.defaultViewModel()?.properties.map((property) => `${property.name}:${property.type}`),
          "| state machine inputs:",
          rive.stateMachineInputs(PROGRESS_BAR.stateMachine)?.map((input) => `${input.name}:${input.type}`),
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

let comboTimer: ReturnType<typeof setTimeout> | undefined;

/** Sets `combo` to 3 when the fill changes, then back to 0 after 1s. */
export const pulseCombo = () => {
  clearTimeout(comboTimer);
  writeCombo(PROGRESS_BAR.comboValue);
  comboTimer = setTimeout(() => writeCombo(0), PROGRESS_BAR.comboHoldMs);
};

const RESULT_NAME = { correct: /correct|right|success|win/i, wrong: /wrong|incorrect|fail|lose|error/i } as const;

/** Plays the bar's reaction to a checked answer. Looks for a trigger named for
 * the result (`correct` / `wrong`) on the view model, then on the state
 * machine's inputs, so either way of building the rig works. */
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
  const input = rive.stateMachineInputs(PROGRESS_BAR.stateMachine)?.find((candidate) => matches(candidate.name));
  if (input) {
    if (input.type === StateMachineInputType.Trigger) input.fire();
    else input.value = true;
    return;
  }
  console.warn(`[progress bar] no "${exact}" trigger found on the view model or state machine`);
};
