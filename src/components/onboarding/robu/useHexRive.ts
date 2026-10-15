"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Layout } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  HEX_RIVE_SRC,
  HEX_ARTBOARD,
  HEX_VIEW_MODEL,
  HEX_STOP_TALK_TRIGGER,
  HEX_DARK_THEME,
  isHexTalkTrigger,
} from "@/lib/rive/runtime";
import { useTheme } from "@/context/ThemeContext";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Two triggers fired in the same frame aren't both consumed, so queued
// triggers go out one at a time, this far apart.
const TRIGGER_GAP_MS = 150;

/**
 * Hex on his own canvas, playing the one state machine in `state`. Changing
 * `state` stops whatever is playing and starts the new machine, so only one
 * pose ever runs. `null` leaves him stopped.
 *
 * The artboard's view model instance (`Onboarding` unless `viewModel` says
 * otherwise) is bound to whichever machine is playing (a machine started
 * later isn't bound on its own, hence the rebind after every `play`);
 * `fireTrigger` / `setNumber` / `setBoolean` drive it. Triggers are queued
 * and spaced `TRIGGER_GAP_MS` apart; `fireNow` drops what's still queued and
 * fires its trigger at once, so whatever is fired after it follows it.
 */
export function useHexRive(
  layout: Layout,
  state: string | null,
  artboard: string = HEX_ARTBOARD,
  viewModel: string = HEX_VIEW_MODEL,
) {
  const { theme } = useTheme();
  const { rive, RiveComponent } = useRive({
    src: HEX_RIVE_SRC,
    artboard,
    autoplay: false,
    layout,
  });

  const viewModelInstance = useMemo(
    () => rive?.viewModelByName(viewModel)?.defaultInstance() ?? null,
    [rive, viewModel],
  );

  useEffect(() => {
    if (!rive) return;
    const playing = rive.playingStateMachineNames;
    if (playing.length > 0) rive.stop(playing);
    if (state && rive.stateMachineNames.includes(state)) rive.play(state);
    if (viewModelInstance) rive.bindViewModelInstance(viewModelInstance);
  }, [rive, state, viewModelInstance]);

  const queue = useRef<string[]>([]);
  const gapTimer = useRef<number | undefined>(undefined);
  // True from a talk trigger until the `stopTalk` that ends it.
  const talking = useRef(false);
  const drain = useCallback(() => {
    const next = queue.current[0];
    if (next === undefined) {
      gapTimer.current = undefined;
      return;
    }
    // Anything but another talk ends the talk first, ahead of that trigger.
    if (next === HEX_STOP_TALK_TRIGGER) {
      // Already the end of the talk: no second `stopTalk` ahead of it.
      talking.current = false;
    } else if (talking.current && !isHexTalkTrigger(next)) {
      talking.current = false;
      viewModelInstance?.trigger(HEX_STOP_TALK_TRIGGER)?.trigger();
      gapTimer.current = window.setTimeout(drain, TRIGGER_GAP_MS);
      return;
    }
    queue.current.shift();
    if (isHexTalkTrigger(next)) talking.current = true;
    viewModelInstance?.trigger(next)?.trigger();
    gapTimer.current = window.setTimeout(drain, TRIGGER_GAP_MS);
  }, [viewModelInstance]);

  const fireTrigger = useCallback(
    (name: string) => {
      queue.current.push(name);
      if (gapTimer.current !== undefined) return;
      drain();
    },
    [drain],
  );

  // Drops queued triggers and restarts the playing machine from its entry
  // state (idle). Triggers fired afterwards wait one gap, so the machine has
  // settled into idle before the first one lands.
  const reset = useCallback(() => {
    if (!rive) return;
    window.clearTimeout(gapTimer.current);
    queue.current = [];
    talking.current = false;
    const playing = rive.playingStateMachineNames;
    if (playing.length > 0) rive.stop(playing);
    if (state && rive.stateMachineNames.includes(state)) rive.play(state);
    if (viewModelInstance) rive.bindViewModelInstance(viewModelInstance);
    gapTimer.current = window.setTimeout(drain, TRIGGER_GAP_MS);
  }, [rive, state, viewModelInstance, drain]);

  const fireNow = useCallback(
    (name: string) => {
      window.clearTimeout(gapTimer.current);
      gapTimer.current = undefined;
      queue.current = [];
      fireTrigger(name);
    },
    [fireTrigger],
  );

  useEffect(
    () => () => {
      window.clearTimeout(gapTimer.current);
      gapTimer.current = undefined;
      queue.current = [];
      talking.current = false;
    },
    [viewModelInstance],
  );

  const setNumber = useCallback(
    (name: string, value: number) => {
      const property = viewModelInstance?.number(name);
      if (property) property.value = value;
    },
    [viewModelInstance],
  );

  const setBoolean = useCallback(
    (name: string, value: boolean) => {
      const property = viewModelInstance?.boolean(name);
      if (property) property.value = value;
    },
    [viewModelInstance],
  );

  // Keeps the rig's `darkTheme` flag in step with the site theme. Skipped
  // silently on view models that don't expose it.
  useEffect(() => {
    setBoolean(HEX_DARK_THEME, theme === "dark");
  }, [setBoolean, theme]);

  return {
    rive,
    RiveComponent,
    ready: viewModelInstance !== null,
    fireTrigger,
    fireNow,
    reset,
    setNumber,
    setBoolean,
  };
}
