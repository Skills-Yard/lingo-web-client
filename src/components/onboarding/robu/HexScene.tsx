"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import type { HexScene as HexSceneConfig } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/** A full-screen Hex artboard (see `HEX_SCENE`), playing its state machine
 * once on its own canvas. */
export function HexScene({ scene, className }: { scene: HexSceneConfig; className?: string }) {
  const { RiveComponent } = useHexRive(LAYOUT, scene.stateMachine, scene.artboard);
  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
