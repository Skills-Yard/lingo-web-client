"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Layout } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  HEX_RIVE_SRC,
  HEX_ARTBOARD,
  HEX_VIEW_MODEL,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

/**
 * Hex on his own canvas, playing the one state machine in `state`. Changing
 * `state` stops whatever is playing and starts the new machine, so only one
 * pose ever runs. `null` leaves him stopped.
 *
 * The artboard's `Onboarding` view model instance is bound to whichever
 * machine is playing (a machine started later isn't bound on its own, hence
 * the rebind after every `play`); `fireTrigger` / `setNumber` drive it.
 */
export function useHexRive(layout: Layout, state: string | null, artboard: string = HEX_ARTBOARD) {
  const { rive, RiveComponent } = useRive({
    src: HEX_RIVE_SRC,
    artboard,
    autoplay: false,
    layout,
  });

  const viewModelInstance = useMemo(
    () => rive?.viewModelByName(HEX_VIEW_MODEL)?.defaultInstance() ?? null,
    [rive],
  );

  useEffect(() => {
    if (!rive) return;
    const playing = rive.playingStateMachineNames;
    if (playing.length > 0) rive.stop(playing);
    if (state && rive.stateMachineNames.includes(state)) rive.play(state);
    if (viewModelInstance) rive.bindViewModelInstance(viewModelInstance);
  }, [rive, state, viewModelInstance]);

  const fireTrigger = useCallback(
    (name: string) => viewModelInstance?.trigger(name)?.trigger(),
    [viewModelInstance],
  );

  const setNumber = useCallback(
    (name: string, value: number) => {
      const property = viewModelInstance?.number(name);
      if (property) property.value = value;
    },
    [viewModelInstance],
  );

  return { rive, RiveComponent, ready: viewModelInstance !== null, fireTrigger, setNumber };
}
