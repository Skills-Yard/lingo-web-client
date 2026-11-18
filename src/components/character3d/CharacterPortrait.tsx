"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { placePortrait, setPortraitPose } from "./portraitHost";

type CharacterPortraitProps = {
  /** One of `ANIMATIONS` in `character.ts`. */
  animationId: string;
  /** The mouth moves (see `AnimatedCharacter`). */
  lipSync?: boolean;
};

/**
 * The 3D character as a picture on a screen, not a viewer: it fills whatever box
 * it is put in, can't be turned, grabbed or zoomed, and takes no taps (they go
 * to what is under it). It is the one shared canvas (see `portraitHost.tsx`, whose
 * `PortraitHost` must be somewhere above, as in the 3D screens' layout), moved into
 * this box and scaled to its height, so it is there at once: nothing is made, compiled,
 * uploaded or resized when a screen opens. The screen picks the animation.
 */
export const CharacterPortrait = ({ animationId, lipSync = false }: CharacterPortraitProps) => {
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = slot.current;
    return element ? placePortrait(element) : undefined;
  }, []);

  useEffect(() => setPortraitPose({ animationId, lipSync }), [animationId, lipSync]);

  return <div ref={slot} aria-hidden className="pointer-events-none relative size-full" />;
};
