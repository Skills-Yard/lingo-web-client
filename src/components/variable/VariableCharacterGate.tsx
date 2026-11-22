"use client";

import { useEffect, type ReactNode } from "react";
import { PortraitHost, usePortraitDrawn } from "@/components/character3d/portraitHost";
import { preloadCharacter, useSharedCharacter } from "@/components/character3d/sharedCharacter";
import { LoadingBar } from "@/components/rive/RiveLoading";

/**
 * Shows a loading bar, and nothing else, until the chosen 3D character is loaded and its canvas has drawn its first frames
 * (behind the bar), so no Variable screen waits for it once it is on screen: the character stands where Hex used to, beside the
 * speech bubbles. It sits in the module's layout, so it is there for every screen the route is opened on, and passes straight through
 * for the others (the character and its canvas stay for the visit). The Sequence's 3D route has the same, with its voices and pictures too
 * (see `Sequence3dAssetsGate`).
 */
export function VariableCharacterGate({ children }: { children: ReactNode }) {
  const character = useSharedCharacter();
  const drawn = usePortraitDrawn();
  useEffect(() => {
    preloadCharacter();
  }, []);
  // Without a character (it could not be loaded) there is no canvas to wait for: the screens go on without it.
  const ready = character.settled && (drawn || !character.character);
  return (
    <>
      <PortraitHost />
      {ready ? children : <LoadingBar progress={ready ? 1 : Math.min(character.fraction, 0.98)} />}
    </>
  );
}
