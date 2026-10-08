"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Layout } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  HEX_RIVE_SRC,
  HEX_ARTBOARD,
  type HexState,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

/**
 * Hex on his own canvas, playing the one `HEX-*` state machine in `state`.
 * Changing `state` stops whatever is playing and starts the new machine, so
 * only one pose ever runs. `null` leaves him stopped.
 */
export function useHexRive(layout: Layout, state: HexState | null) {
  const { rive, RiveComponent } = useRive({
    src: HEX_RIVE_SRC,
    artboard: HEX_ARTBOARD,
    autoplay: false,
    layout,
  });

  useEffect(() => {
    if (!rive) return;
    const playing = rive.playingStateMachineNames;
    if (playing.length > 0) rive.stop(playing);
    if (state && rive.stateMachineNames.includes(state)) rive.play(state);
  }, [rive, state]);

  return { rive, RiveComponent };
}
