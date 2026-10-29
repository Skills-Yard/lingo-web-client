"use client";

import { createElement, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Layout } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  HEX_ARTBOARD,
  HEX_VIEW_MODEL,
  HEX_STOP_TALK_TRIGGER,
  HEX_DARK_THEME,
  HEX_ENTER_STYLE,
  HEX_ONBOARDING_TRIGGER,
  isHexTalkTrigger,
} from "@/lib/rive/runtime";
import { hexRiveSource } from "@/lib/rive/hexFile";
import { useTheme } from "@/context/ThemeContext";
import { HexEntryStyleContext } from "./hexExit";

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
 *
 * With an `entryKey`, every new key plays Hex's entrance: `entryStyle` is set,
 * and `enter` fires first; whatever the screen fires next (talk, its beat)
 * follows it straight away.
 */
export function useHexRive(
  layout: Layout,
  state: string | null,
  artboard: string = HEX_ARTBOARD,
  viewModel: string = HEX_VIEW_MODEL,
  entryKey: string | null = null,
  entryStyleOverride: number | null = null,
  enterTrigger: string = HEX_ONBOARDING_TRIGGER.enter,
  bleed?: { x: number; y: number; bottom?: number },
) {
  const { theme } = useTheme();
  const contextEntryStyle = useContext(HexEntryStyleContext);
  const entryStyle = entryStyleOverride ?? contextEntryStyle ?? HEX_ENTER_STYLE.style;
  const entryStyleRef = useRef(entryStyle);
  entryStyleRef.current = entryStyle;
  const { rive, RiveComponent } = useRive({
    ...hexRiveSource(),
    artboard,
    // Only read when the canvas is created; later `state` changes are played
    // by the effect below. Naming it here keeps Rive from defaulting to the
    // artboard's first linear animation (deprecated, and warns).
    stateMachine: state ?? undefined,
    autoplay: false,
    layout,
  });

  // The canvas reaches `bleed` past Hex's box (see HexBleed); the artboard
  // is fitted into the box itself. Rive resets its layout bounds to the whole
  // canvas on every resize, so that step is wrapped to inset them again.
  // The bleed is in layout px, but the canvas is drawn at its on-screen size
  // (the shell scales its stage), so the inset is scaled the same way, and
  // redone whenever that scale changes (e.g. the browser toolbar hiding).
  // `bottom` overrides `y` for the bottom edge alone, for a canvas that
  // reaches further down than up (Hex entering from / leaving through the bottom).
  useEffect(() => {
    if (!rive || !bleed) return;
    const target = rive as unknown as { resizeToCanvas: () => void; canvas: HTMLCanvasElement };
    const original = target.resizeToCanvas.bind(rive);
    const stageScale = () => {
      const { canvas } = target;
      return canvas.offsetWidth > 0 ? canvas.getBoundingClientRect().width / canvas.offsetWidth : 1;
    };
    const inset = () => {
      original();
      const { width, height } = target.canvas;
      // Drawing-surface px per layout px, read off the surface itself: it isn't
      // always sized to the on-screen (scaled) box, and a pad worked out from
      // the on-screen scale then fits Hex into the wrong region.
      const pxPerLayoutPx = target.canvas.offsetWidth > 0 ? width / target.canvas.offsetWidth : 1;
      const padX = bleed.x * pxPerLayoutPx;
      const padTop = bleed.y * pxPerLayoutPx;
      const padBottom = (bleed.bottom ?? bleed.y) * pxPerLayoutPx;
      if (width <= padX * 2 || height <= padTop + padBottom) return;
      rive.layout = rive.layout.copyWith({ minX: padX, minY: padTop, maxX: width - padX, maxY: height - padBottom });
    };
    target.resizeToCanvas = inset;
    rive.resizeDrawingSurfaceToCanvas();
    let lastScale = stageScale();
    let frame = requestAnimationFrame(function watch() {
      const scale = stageScale();
      if (Math.abs(scale - lastScale) > 0.001) {
        lastScale = scale;
        rive.resizeDrawingSurfaceToCanvas();
      }
      frame = requestAnimationFrame(watch);
    });
    return () => {
      cancelAnimationFrame(frame);
      target.resizeToCanvas = original;
    };
  }, [rive, bleed]);

  const viewModelInstance = useMemo(
    () => rive?.viewModelByName(viewModel)?.defaultInstance() ?? null,
    [rive, viewModel],
  );

  useEffect(() => {
    if (!rive) return;
    const playing = rive.playingStateMachineNames;
    playing.forEach((name) => rive.stop(name));
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

  const enteringRef = useRef(false);
  const enterTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(enterTimer.current);
    if (!entryKey || !viewModelInstance) {
      enteringRef.current = false;
      return;
    }
    enteringRef.current = true;
    const style = viewModelInstance.number(HEX_ENTER_STYLE.property);
    if (style) style.value = entryStyleRef.current;
    fireTrigger(enterTrigger);
    enterTimer.current = window.setTimeout(() => {
      enteringRef.current = false;
    }, TRIGGER_GAP_MS);
    return () => window.clearTimeout(enterTimer.current);
  }, [entryKey, viewModelInstance, fireTrigger, enterTrigger]);

  // Drops queued triggers and restarts the playing machine from its entry
  // state (idle). Triggers fired afterwards wait one gap, so the machine has
  // settled into idle before the first one lands.
  const reset = useCallback(() => {
    if (!rive) return;
    window.clearTimeout(gapTimer.current);
    queue.current = [];
    talking.current = false;
    // A restart mid-entrance must not swallow the `enter` just fired.
    if (enteringRef.current) queue.current = [enterTrigger];
    const playing = rive.playingStateMachineNames;
    playing.forEach((name) => rive.stop(name));
    if (state && rive.stateMachineNames.includes(state)) rive.play(state);
    if (viewModelInstance) rive.bindViewModelInstance(viewModelInstance);
    gapTimer.current = window.setTimeout(drain, TRIGGER_GAP_MS);
  }, [rive, state, viewModelInstance, drain, enterTrigger]);

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

  // The same canvas, marked `data-hex` so the hidden dev panel can tell where
  // Hex is on screen (see DevPanel).
  const HexCanvas = useMemo(() => {
    const Marked = (props: Parameters<typeof RiveComponent>[0]) =>
      createElement(RiveComponent, { ...props, "data-hex": "" } as typeof props);
    return Marked;
  }, [RiveComponent]);

  return {
    rive,
    RiveComponent: HexCanvas,
    ready: viewModelInstance !== null,
    fireTrigger,
    fireNow,
    reset,
    setNumber,
    setBoolean,
  };
}
