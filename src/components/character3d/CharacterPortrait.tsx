"use client";

import { useLayoutEffect, useRef } from "react";
import { placePortrait, setPortraitPose, type PortraitFraming } from "./portraitHost";

type CharacterPortraitProps = {
  /** One of `ANIMATIONS` in `character.ts`. */
  animationId: string;
  /** The mouth moves (see `AnimatedCharacter`). */
  lipSync?: boolean;
  /** How much of the character shows: head to toe (default) or head and chest. */
  framing?: PortraitFraming;
};

/**
 * The 3D character as a picture on a screen, not a viewer: it fills whatever box
 * it is put in, can't be turned, grabbed or zoomed, and takes no taps (they go
 * to what is under it). It is the one shared canvas (see `portraitHost.tsx`, whose
 * `PortraitHost` must be somewhere above, as in the 3D screens' layout), moved into
 * this box and scaled to its height, so it is there at once: nothing is made, compiled,
 * uploaded or resized when a screen opens. The screen picks the animation and the framing.
 */
export const CharacterPortrait = ({ animationId, lipSync = false, framing = "full" }: CharacterPortraitProps) => {
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = slot.current;
    return element ? placePortrait(element) : undefined;
  }, []);

  // Set in the layout phase, with the canvas's move into this box, so a framing is not first seen in the wrong one.
  useLayoutEffect(() => setPortraitPose({ animationId, lipSync, framing }), [animationId, lipSync, framing]);

  return <div ref={slot} aria-hidden className="pointer-events-none relative size-full" />;
};
