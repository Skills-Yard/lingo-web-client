"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector3, type Object3D } from "three";
import type { Character } from "./character";
import { AnimatedCharacter, SceneLights } from "./CharacterScene";
import { useSharedCharacter } from "./sharedCharacter";

/**
 * One 3D canvas for all the screens that show the character as a picture (see
 * `CharacterPortrait`), like the module's one bedroom (`roomHost`): every screen is a page
 * of its own, so a canvas made by each would make a WebGL context, compile the shaders and
 * upload the textures again on every one, and the screen would stall while it did. Here it
 * is made once, by `PortraitHost` (in the route's layout, behind its loading bar), drawn
 * its first frames there, and every screen just moves it into its own box.
 *
 * Between screens (and before the first) the canvas stands in a parking box off the
 * screen, the size of a phone's character box, so it never measures as empty and
 * collapses.
 */

/** How much of the character the camera shows: all of it, head to toe, the head and chest, close up, or just the head and neck (`face`, for a small avatar box). */
export type PortraitFraming = "full" | "bust" | "face";

type Pose = { animationId: string; lipSync: boolean; framing: PortraitFraming };

const REST: Pose = { animationId: "idle-b", lipSync: false, framing: "full" };

let pose = REST;
/** The canvas has drawn its first frames: shaders compiled, textures uploaded. */
let drawn = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** What the character does: set by whichever screen has the canvas. */
export const setPortraitPose = (next: Pose) => {
  if (next.animationId === pose.animationId && next.lipSync === pose.lipSync && next.framing === pose.framing) return;
  pose = next;
  emit();
};

/** Whether the canvas has drawn its first frames (so showing it won't stall). */
export const usePortraitDrawn = () => useSyncExternalStore(subscribe, () => drawn, () => false);

const setDrawn = (next: boolean) => {
  if (drawn === next) return;
  drawn = next;
  emit();
};

/**
 * The canvas's own size (px) never changes: a canvas that is resized has its drawing
 * buffers made again, which stalls the page for as long as the machine takes to do it (a
 * second or more on a slow one), so moving it into a box of another size would do just
 * that. It is drawn at this size and scaled to its slot's height with CSS instead.
 */
const HOST_WIDTH = 380;
const HOST_HEIGHT = 680;

let parking: HTMLDivElement | null = null;
let host: HTMLDivElement | null = null;

/** The box the canvas lives in, made the first time it is asked for. */
const getHost = () => {
  if (host && parking) return host;
  parking = document.createElement("div");
  parking.setAttribute("aria-hidden", "true");
  parking.style.cssText = `position:fixed;left:-10000px;top:0;width:${HOST_WIDTH}px;height:${HOST_HEIGHT}px;pointer-events:none;visibility:hidden`;
  document.body.appendChild(parking);
  host = document.createElement("div");
  // Centred across whatever it stands in, and scaled from its top, so the character stays where it is across.
  host.style.cssText = `position:absolute;left:50%;top:0;width:${HOST_WIDTH}px;height:${HOST_HEIGHT}px;margin-left:${-HOST_WIDTH / 2}px;transform-origin:50% 0;pointer-events:none`;
  parking.appendChild(host);
  return host;
};

/**
 * Puts the canvas into `slot` (a positioned box), scaled to the slot's height as it
 * changes. Returns what takes it out again, back to the parking box (if it is still in
 * `slot`: the next screen may have it already).
 */
export const placePortrait = (slot: HTMLElement) => {
  const element = getHost();
  slot.appendChild(element);
  const fit = () => {
    element.style.transform = `scale(${slot.clientHeight / HOST_HEIGHT})`;
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(slot);
  return () => {
    observer.disconnect();
    if (parking && element.parentElement === slot) {
      element.style.transform = "";
      parking.appendChild(element);
    }
  };
};

/** Counts the first frames, then says the canvas is ready: the first one compiles the shaders and uploads the textures. */
const DrawnAfterFrames = () => {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) setDrawn(true);
  });
  return null;
};

/**
 * Makes the canvas, once the shared character has loaded, and keeps it for as long as it
 * is mounted (the route's layout, so for every screen of the route). Shows nothing itself:
 * the canvas is in its box, which a screen's `CharacterPortrait` moves.
 */
export function PortraitHost() {
  const { character } = useSharedCharacter();
  const { animationId, lipSync, framing } = useSyncExternalStore(subscribe, () => pose, () => REST);

  useEffect(() => () => setDrawn(false), []);

  if (!character) return null;
  return createPortal(
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 32, near: 0.1, far: 50, position: CAMERA_POSITION, rotation: NO_ROTATION }}
      gl={{ antialias: true, alpha: true }}
      // The size is measured from the box's layout, not from what the screen's scale makes of it.
      resize={{ offsetSize: true }}
      flat
    >
      <SceneLights lights={character.lights} />
      <AnimatedCharacter character={character} animationId={animationId} runToken={0} playing lipSync={lipSync} onLoop={ignoreLoop} />
      <FramingCamera framing={framing} character={character} />
      <DrawnAfterFrames />
    </Canvas>,
    getHost(),
  );
}

/**
 * Head to toe, straight on (the camera is level, so nothing leans): the character
 * is 1.8 tall and stands on y = 0, so this shows 2.06 of height, from just under
 * the feet to 0.23 over the head, whatever the box's shape (the camera's view
 * is fixed by its height, so a wider box shows more at the sides, not more of the character).
 */
const CAMERA_POSITION: [number, number, number] = [0, 1.0, 3.6];
const NO_ROTATION: [number, number, number] = [0, 0, 0];

/**
 * Where the camera stands for each framing. `bust` is the same level camera, closer and
 * higher: it shows 1.44 m of height (from 0.29 m over the head to the chest) instead of
 * 2.06, so the head and chest fill the box. The canvas's own size is the same (see
 * `HOST_WIDTH`), so it is drawn that much sharper than a picture scaled up would be.
 * `face` is closer still and level with the head (the characters are all scaled to 1.8 m, so their heads are at about the same
 * height): it shows 1.0 m of height, and follows the head's x (see `FramingCamera`).
 */
const FRAMING_CAMERA: Record<PortraitFraming, readonly [number, number, number]> = {
  full: CAMERA_POSITION,
  bust: [0, 1.369, 2.507],
  face: [0, 1.62, 1.75],
};

/** The hips bone, whatever the rig calls it (`mixamorigHips`, `J_Bip_C_Hips`). */
const HIPS_NAME = /hips$/i;
/** The head bone (`mixamorigHead`, `J_Bip_C_Head`; not the `…HeadTop_End` tip). */
const HEAD_NAME = /head$/i;

const boneOf = (character: Character, name: RegExp): Object3D | undefined => {
  const found: Object3D[] = [];
  character.model.traverse((object) => {
    if (name.test(object.name)) found.push(object);
  });
  return found[0];
};

/**
 * Moves the camera to the pose's framing (the canvas draws every frame, so it shows at
 * once). Close up, it also follows the hips across: an idle animation shifts the weight
 * from side to side, which at that distance would take the character out of the middle.
 */
const FramingCamera = ({ framing, character }: { framing: PortraitFraming; character: Character }) => {
  const hips = useMemo(() => boneOf(character, HIPS_NAME), [character]);
  const head = useMemo(() => boneOf(character, HEAD_NAME), [character]);
  const boneAt = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    const [x, y, z] = FRAMING_CAMERA[framing];
    // Close up it follows the hips (`bust`) or the head (`face`) across.
    const follows = framing === "bust" ? hips : framing === "face" ? head : undefined;
    if (follows) {
      follows.getWorldPosition(boneAt);
      camera.position.set(boneAt.x, y, z);
    } else {
      camera.position.set(x, y, z);
    }
  });
  return null;
};

/** Nothing here ever loops into anything: the screen picks the animation. */
const ignoreLoop = () => {};
