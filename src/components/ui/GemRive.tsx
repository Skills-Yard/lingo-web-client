"use client";

import { useRive } from "@rive-app/react-canvas";
import { configureRiveRuntime, GEM } from "@/lib/rive/runtime";
import { riveSource } from "@/lib/rive/riveCache";

configureRiveRuntime();

/** The gem: the "Gem" artboard and "State Machine 1" state machine of `gem` (a Rive file), in a box the caller sizes with `className`. */
export function GemRive({ className = "" }: { className?: string }) {
  const { RiveComponent } = useRive({ ...riveSource(GEM.src), artboard: GEM.artboard, stateMachines: GEM.stateMachine, autoplay: true });
  return (
    <span aria-hidden className={`pointer-events-none relative inline-block shrink-0 select-none ${className}`}>
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </span>
  );
}
