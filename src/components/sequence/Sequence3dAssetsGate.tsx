"use client";

import type { ReactNode } from "react";
import { PortraitHost } from "@/components/character3d/portraitHost";
import { LoadingBar } from "@/components/rive/RiveLoading";
import { useSequence3dAssets } from "./sequence3dAssets";

/**
 * Shows a loading bar, and nothing else, until everything the 3D copies of the Sequence
 * screens use is loaded and ready to draw (the character, the voices, the pictures, and the
 * character's canvas, which draws its first frames here, behind the bar: see
 * `sequence3dAssets.ts`), so none of them waits for anything once it is on screen. It sits
 * in the route's layout, so it is there for any of the screens the route is opened on, and
 * passes straight through for the others (the assets and the canvas stay for the visit).
 */
export function Sequence3dAssetsGate({ children }: { children: ReactNode }) {
  const { ready, progress } = useSequence3dAssets();
  return (
    <>
      <PortraitHost />
      {ready ? children : <LoadingBar progress={progress} />}
    </>
  );
}
