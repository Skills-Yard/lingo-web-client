"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { HEX_BACKGROUND } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

/** The onboarding flow's animated grid background (`HEX_BACKGROUND`), on its
 * own canvas. Transparent — whatever sits behind it is the page colour. */
export function HexBackground({ className }: { className?: string }) {
  const { RiveComponent } = useHexRive(
    LAYOUT,
    HEX_BACKGROUND.stateMachine,
    HEX_BACKGROUND.artboard,
  );
  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
