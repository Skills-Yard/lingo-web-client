"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** Hex, floating in place, filling the box it is given. */
export function HexAvatar({ className }: { className?: string }) {
  const { RiveComponent } = useHexRive(LAYOUT, HEX_STATE.idle);
  return <RiveComponent className={className} />;
}
