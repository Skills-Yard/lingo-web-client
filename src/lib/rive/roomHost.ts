import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { configureRiveRuntime, SEQUENCE_ROOM } from "./runtime";

/**
 * One bedroom for the whole Sequence module, like the robot (see `robotHost`):
 * every screen is its own page, so a room created per screen would reload and
 * start over on each step. The canvas lives here and each slot just moves it
 * in, so the boy carries on from where the last screen left him. A screen that
 * needs him in something he can't reach from there gets the art's `reset` first.
 */
export type RoomDress = "bare" | "socks" | "dressed" | "shoesOnly" | "trySocks";
export type RoomFit = "width" | "cover";

type Host = { element: HTMLDivElement; rive: Rive | null; loaded: boolean; settled: boolean };

const { trigger, triggerGapMs } = SEQUENCE_ROOM;

/** A trigger fired the moment the file loads is dropped (the machine is still entering its first state). */
const SETTLE_MS = 600;

const LAYOUTS: Record<RoomFit, () => Layout> = {
  width: () => new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter }),
  cover: () => new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
};

let host: Host | null = null;
let shown: RoomDress = "bare";
let wanted: RoomDress = "bare";
let wantedFit: RoomFit = "width";
let wantedDark = false;
let happyOnArrival = false;
let playing = false;

/** The one move that gets the boy closer to `to`, and what he has on after it. */
const nextMove = (from: RoomDress, to: RoomDress): { name: string; leaves: RoomDress } => {
  if (from === "bare" && (to === "socks" || to === "dressed")) return { name: trigger.wearSocks, leaves: "socks" };
  if (from === "bare" && to === "shoesOnly") return { name: trigger.wearShoesNoSocks, leaves: "shoesOnly" };
  if ((from === "bare" || from === "shoesOnly") && to === "trySocks") return { name: trigger.shoesThenTrySocks, leaves: "trySocks" };
  if (from === "socks" && to === "dressed") return { name: trigger.wearShoes, leaves: "dressed" };
  return { name: trigger.reset, leaves: "bare" };
};

const fire = (name: string) => host?.rive?.viewModelInstance?.trigger(name)?.trigger();

/** Plays the moves to `wanted` one at a time: the file can drop triggers fired together. */
const play = () => {
  if (!host?.settled || playing) return;
  if (shown === wanted) {
    // The first time, the canvas stays hidden until he is ready, as the file can't start at the end of a trigger.
    host.element.style.opacity = "1";
    if (happyOnArrival) fire(trigger.happy);
    happyOnArrival = false;
    return;
  }
  const move = nextMove(shown, wanted);
  fire(move.name);
  shown = move.leaves;
  playing = true;
  window.setTimeout(() => {
    playing = false;
    play();
  }, triggerGapMs);
};

const applyFit = () => {
  if (host?.rive && host.loaded) Object.assign(host.rive, { layout: LAYOUTS[wantedFit]() });
};

const applyDark = () => {
  const dark = host?.loaded ? host.rive?.viewModelInstance?.boolean(SEQUENCE_ROOM.darkProperty) : null;
  if (dark) dark.value = wantedDark;
};

export const getRoomHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity 300ms";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%";
  element.appendChild(canvas);
  const created: Host = { element, rive: null, loaded: false, settled: false };
  host = created;
  // A cached file can finish loading before `new Rive` has returned, so wait for the instance.
  const onLoad = () => {
    const rive = created.rive;
    if (!rive) {
      queueMicrotask(onLoad);
      return;
    }
    created.loaded = true;
    rive.resizeDrawingSurfaceToCanvas();
    applyFit();
    applyDark();
    window.setTimeout(() => {
      created.settled = true;
      play();
    }, SETTLE_MS);
  };
  created.rive = new Rive({
    src: SEQUENCE_ROOM.src,
    canvas,
    artboard: SEQUENCE_ROOM.artboard,
    stateMachine: SEQUENCE_ROOM.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUTS[wantedFit](),
    onLoad,
  });
  return created;
};

/** Asks for the boy in `dress`; `happy` plays his cheer once he is. */
export const setRoomDress = (dress: RoomDress, happy: boolean) => {
  wanted = dress;
  happyOnArrival = happy;
  play();
};

export const setRoomFit = (fit: RoomFit) => {
  wantedFit = fit;
  applyFit();
};

export const setRoomDark = (dark: boolean) => {
  wantedDark = dark;
  applyDark();
};
