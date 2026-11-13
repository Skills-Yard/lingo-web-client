"use client";

import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { AnimationMixer, CanvasTexture, LoopOnce, LoopRepeat, type AnimationAction } from "three";
import type { Character } from "./character";

type Vec3 = [number, number, number];

/**
 * The character is 1.8 tall and stands on y = 0: this frames it head to toe, with
 * room below for the stand-up, which starts with the legs stretched out on the floor.
 */
const CAMERA_POSITION: Vec3 = [0, 1.2, 3.9];
const CAMERA_TARGET: Vec3 = [0, 0.8, 0];

/** A frame this long (a hidden tab, or the loop resuming after a pause) is treated as 100 ms. */
const MAX_FRAME_SECONDS = 0.1;

/** How long one animation blends into the next. */
const FADE_SECONDS = 0.3;

type AnimatedCharacterProps = {
  character: Character;
  animationId: string;
  /** Bumped to start the animation over, including when it is the one already playing. */
  runToken: number;
  playing: boolean;
  /** A one-shot animation reached its last pose. */
  onFinished: () => void;
};

const AnimatedCharacter = ({ character, animationId, runToken, playing, onFinished }: AnimatedCharacterProps) => {
  const { mixer, actions } = useMemo(() => {
    const mixer = new AnimationMixer(character.model);
    const actions = new Map<string, AnimationAction>();
    for (const { id, clip, loop } of character.animations) {
      const action = mixer.clipAction(clip);
      action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
      action.clampWhenFinished = true; // a one-shot holds its last pose
      actions.set(id, action);
    }
    return { mixer, actions };
  }, [character]);
  const current = useRef<AnimationAction | null>(null);

  // Start the chosen animation, blending out of the one that was playing.
  useEffect(() => {
    const next = actions.get(animationId);
    if (!next) return;
    const previous = current.current;
    next.reset().play();
    if (previous && previous !== next) previous.crossFadeTo(next, FADE_SECONDS, false);
    current.current = next;
  }, [actions, animationId, runToken]);

  useEffect(() => {
    const handleFinished = (event: { action: AnimationAction }) => {
      if (event.action === current.current) onFinished();
    };
    mixer.addEventListener("finished", handleFinished);
    return () => mixer.removeEventListener("finished", handleFinished);
  }, [mixer, onFinished]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(character.model);
      current.current = null;
    },
    [mixer, character],
  );

  // Paused is a clock that doesn't advance: the pose stays, the camera still moves.
  useFrame((_, delta) => mixer.update(playing ? Math.min(delta, MAX_FRAME_SECONDS) : 0));

  return <primitive object={character.scene} />;
};

const SHADOW_TEXTURE_SIZE = 128;

/** A soft dark disc under the feet: a baked radial gradient, so it costs no render pass of its own. */
const GroundShadow = () => {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SHADOW_TEXTURE_SIZE;
    canvas.height = SHADOW_TEXTURE_SIZE;
    const context = canvas.getContext("2d");
    if (context) {
      const middle = SHADOW_TEXTURE_SIZE / 2;
      const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.22)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, SHADOW_TEXTURE_SIZE, SHADOW_TEXTURE_SIZE);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.003}>
      <planeGeometry args={[1.2, 1.2]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

type ControlsProps = {
  autoRotate: boolean;
  /** Bumped to send the camera back to where it started. */
  resetToken: number;
};

const Controls = ({ autoRotate, resetToken }: ControlsProps) => {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const orbit = controls.current;
    if (resetToken === 0 || !orbit) return;
    // With damping, a flick leaves rotation still to come that would carry on from
    // the new position. An update without damping spends it all, so none is left.
    orbit.enableDamping = false;
    orbit.update();
    orbit.enableDamping = true;
    camera.position.set(...CAMERA_POSITION);
    orbit.target.set(...CAMERA_TARGET);
    orbit.update();
    invalidate();
  }, [resetToken, camera, invalidate]);

  return (
    <OrbitControls
      ref={controls}
      target={CAMERA_TARGET}
      // The view only turns: no zoom (wheel or pinch) and no pan. Without zoom the
      // wheel also scrolls the page over the canvas instead of being swallowed by it.
      enableZoom={false}
      enablePan={false}
      enableDamping
      autoRotate={autoRotate}
      autoRotateSpeed={2}
      // Never above the head, never under the floor.
      minPolarAngle={Math.PI * 0.2}
      maxPolarAngle={Math.PI / 2}
    />
  );
};

type CharacterSceneProps = {
  character: Character;
  animationId: string;
  runToken: number;
  playing: boolean;
  /** The animation is a one-shot that has ended, so nothing is moving. */
  finished: boolean;
  autoRotate: boolean;
  resetToken: number;
  onFinished: () => void;
};

export const CharacterScene = ({
  character,
  animationId,
  runToken,
  playing,
  finished,
  autoRotate,
  resetToken,
  onFinished,
}: CharacterSceneProps) => (
  <Canvas
    dpr={[1, 2]}
    camera={{ fov: 32, near: 0.1, far: 50, position: CAMERA_POSITION }}
    gl={{ antialias: true, alpha: true }}
    // No tone mapping: the skin texture shows in its own colours instead of ACES' dimmer, flatter ones.
    flat
    // Nothing moves while paused or after a one-shot ends: stop drawing frames until the user does something.
    frameloop={(playing && !finished) || autoRotate ? "always" : "demand"}
  >
    <hemisphereLight args={["#ffffff", "#8a94a6", 1.3]} />
    <directionalLight position={[3, 5, 4]} intensity={2.8} />
    <directionalLight position={[-4, 3, -3]} intensity={1.6} color="#7fe0c8" />

    <AnimatedCharacter
      character={character}
      animationId={animationId}
      runToken={runToken}
      playing={playing}
      onFinished={onFinished}
    />
    <GroundShadow />
    <Controls autoRotate={autoRotate} resetToken={resetToken} />
  </Canvas>
);
