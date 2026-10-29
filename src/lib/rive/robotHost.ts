import { Alignment, Fit, Layout, Rive } from "@rive-app/canvas";
import { COMMAND_ROBOT, configureRiveRuntime } from "./runtime";

/**
 * One robot arm for the whole module, like the battery (see `batteryHost`):
 * every screen is its own page, so a robot created per screen would reload and
 * start over on each step instead of carrying on (picked up on step 2, still
 * holding the cube on step 3). The canvas lives here and each slot just moves
 * it in.
 */
type Host = {
  element: HTMLDivElement;
  rive: Rive | null;
  loaded: boolean;
  /** The state machine has had time to settle after loading, so it takes triggers. */
  settled: boolean;
};

export type RobotMove = keyof typeof COMMAND_ROBOT.triggers;

/** Where the cube is: on the table, in the claw, or in the target box. */
export type RobotPose = "idle" | "holding" | "placed";

/** The pose each move leaves the robot in (the others don't change it). */
const POSE_AFTER: Partial<Record<RobotMove, RobotPose>> = {
  pickUp: "holding",
  putDown: "idle",
  placeInTarget: "placed",
  reset: "idle",
};

/** The moves that take the robot from the table to each other pose. */
const MOVES_FROM_IDLE: Record<Exclude<RobotPose, "idle">, readonly RobotMove[]> = {
  holding: ["pickUp"],
  placed: ["pickUp", "placeInTarget"],
};

/** The picture's height (px) at the artboard's own width: the artboard and the room drawn past its top and bottom. */
export const ROBOT_PICTURE_HEIGHT = COMMAND_ROBOT.overflowTop + COMMAND_ROBOT.height + COMMAND_ROBOT.overflowBottom;

/** Two triggers fired in the same frame are not both taken, so queued moves go out this far apart. */
const MOVE_GAP_MS = 150;
/** A trigger fired the moment the file loads is dropped (the machine is still entering its first state), so the first move waits this long. */
const SETTLE_MS = 600;

let host: Host | null = null;
let pose: RobotPose = "idle";
let wantedLabel: string | null = null;
/** Moves asked for before the file had loaded, or too soon after the last one. */
let queue: RobotMove[] = [];
let draining = false;

/**
 * Fits the artboard to the canvas's width and starts it `overflowTop` (scaled)
 * down from the canvas's top, so the room drawn above it shows and the canvas
 * is the whole picture. Rive resets its frame to the whole canvas on every
 * resize, so this is put back after each one.
 */
const frameArtboard = (rive: Rive, canvas: HTMLCanvasElement) => {
  // A canvas with no size yet (still detached) has no frame to set; and the
  // layout setter itself calls `resizeToCanvas` for a zero-sized frame.
  if (!canvas.width || !canvas.height) return;
  const scale = canvas.width / COMMAND_ROBOT.width;
  Object.assign(rive, {
    layout: new Layout({
      fit: Fit.FitWidth,
      alignment: Alignment.TopCenter,
      minX: 0,
      minY: COMMAND_ROBOT.overflowTop * scale,
      maxX: canvas.width,
      maxY: canvas.height,
    }),
  });
};

const applyLabel = (rive: Rive) => {
  const instance = rive.viewModelInstance;
  if (!instance || wantedLabel === null) return;
  const label = instance.string(COMMAND_ROBOT.targetLabelProperty);
  if (label) label.value = wantedLabel;
};

const drain = () => {
  if (draining) return;
  const rive = host?.settled ? host.rive : null;
  const move = queue[0];
  if (!rive || !move) return;
  queue = queue.slice(1);
  rive.viewModelInstance?.trigger(COMMAND_ROBOT.triggers[move])?.trigger();
  draining = true;
  window.setTimeout(() => {
    draining = false;
    drain();
  }, MOVE_GAP_MS);
};

/** Browser only. Creates the canvas and starts loading on first use. */
export const getRobotHost = (): Host => {
  if (host) return host;
  configureRiveRuntime();
  const element = document.createElement("div");
  element.style.cssText = "position:relative;width:100%;height:100%";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;display:block;inset:0;width:100%;height:100%";
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
    const resizeToCanvas = rive.resizeToCanvas.bind(rive);
    Object.assign(rive, {
      resizeToCanvas: () => {
        resizeToCanvas();
        frameArtboard(rive, canvas);
      },
    });
    rive.resizeDrawingSurfaceToCanvas();
    created.loaded = true;
    applyLabel(rive);
    window.setTimeout(() => {
      created.settled = true;
      drain();
    }, SETTLE_MS);
  };
  created.rive = new Rive({
    src: COMMAND_ROBOT.src,
    canvas,
    artboard: COMMAND_ROBOT.artboard,
    stateMachine: COMMAND_ROBOT.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.FitWidth, alignment: Alignment.TopCenter }),
    onLoad,
  });
  return created;
};

/** Plays `move`; held back until the file has loaded. */
export const fireRobot = (move: RobotMove) => {
  pose = POSE_AFTER[move] ?? pose;
  queue = [...queue, move];
  drain();
};

/**
 * Brings the robot to `wanted` from wherever the last screen left it, so a
 * screen can open on the right pose whichever way the learner got there
 * (forward, Back, or a reload on that step). Does nothing if it is already there.
 */
export const syncRobotPose = (wanted: RobotPose) => {
  if (pose === wanted) return;
  if (wanted === "idle") {
    fireRobot("reset");
    return;
  }
  if (pose !== "idle") fireRobot("reset");
  MOVES_FROM_IDLE[wanted].forEach(fireRobot);
};

/** Sets the text on the target box. Safe to call before the file has loaded. */
export const setRobotTargetLabel = (text: string) => {
  wantedLabel = text;
  if (host?.loaded && host.rive) applyLabel(host.rive);
};
