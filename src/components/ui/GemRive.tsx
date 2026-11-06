"use client";

import { useRive } from "@rive-app/react-canvas";
import { configureRiveRuntime } from "@/lib/rive/runtime";

configureRiveRuntime();

/** The gem: the "Gem" artboard and "State Machine 1" state machine of `gem` (a Rive file), in a box the caller sizes with `className`. */
export function GemRive({ className = "" }: { className?: string }) {
  const { RiveComponent } = useRive({ src: "/animations/gem", artboard: "Gem", stateMachines: "State Machine 1", autoplay: true });
  return (
    <span aria-hidden className={`pointer-events-none relative inline-block shrink-0 select-none ${className}`}>
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </span>
  );
}
