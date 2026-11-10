"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties, type Ref } from "react";
import { Alignment, Fit, Layout, type Rive } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { useTheme } from "@/context/ThemeContext";
import { applyArtboardBleed, artboardBleedBox } from "@/lib/rive/bleed";
import { riveSource } from "@/lib/rive/riveCache";
import { configureRiveRuntime } from "@/lib/rive/runtime";
import type { TriggerRequest } from "../types";

configureRiveRuntime();

const FITS = {
  contain: Fit.Contain,
  cover: Fit.Cover,
  fill: Fit.Fill,
  fitWidth: Fit.FitWidth,
  fitHeight: Fit.FitHeight,
} as const;

export type ArtboardFit = keyof typeof FITS;

/** Everything that says which artboard to draw and how (what a preset holds). */
export type ArtboardSource = {
  /** The `.riv` file: a path under `public/`. */
  src: string;
  /** The artboard in it (default: the file's first). */
  artboard?: string;
  /** The state machine to play. */
  stateMachine?: string;
  /** The artboard's own size, so the box keeps its shape before the file has loaded. Read from the file if left out. */
  size?: { width: number; height: number };
  /** Room (in artboard units) around the box for what the art draws past its edge, so it is not clipped. Needs the artboard's size. */
  bleed?: number;
  fit?: ArtboardFit;
  /** Binds the artboard's default view model (default). Turn off for an artboard that has none. */
  bind?: boolean;
  /** Values for the artboard's view model, set when it has loaded and again whenever they change. */
  properties?: Record<string, number | boolean | string>;
  /** The view model's boolean that switches the art to its dark colours: kept in step with the app's theme. */
  darkThemeProperty?: string;
};

export type ArtboardHandle = {
  /** Fires a trigger (of the view model, or of the state machine) by name. */
  fire: (name: string) => void;
  rive: Rive | null;
};

export type ArtboardProps = ArtboardSource & {
  /** Fires `trigger.name` each time `trigger.id` changes — a screen's way to play a move from data. */
  trigger?: TriggerRequest | null;
  onReady?: (rive: Rive) => void;
  /** A handle to fire triggers from code. */
  ref?: Ref<ArtboardHandle>;
  /** What the artboard shows, for screen readers (hidden from them when left out). */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** Fires a trigger of the artboard's view model, or else of its state machine. */
function fireNamed(rive: Rive, name: string, stateMachine?: string) {
  try {
    const trigger = rive.viewModelInstance?.trigger(name);
    if (trigger) {
      trigger.trigger();
      return;
    }
  } catch {
    // Not a view model trigger: try the state machine's inputs.
  }
  if (!stateMachine) return;
  rive.stateMachineInputs(stateMachine)?.find((input) => input.name === name)?.fire();
}

/**
 * Any Rive artboard, drawn in a box that holds the artboard's shape. Everything about it is
 * data: which file and artboard, its view-model properties, a trigger to fire. (For the
 * artboards the app already uses, see `ARTBOARDS` and `PresetArtboard`.)
 */
export function Artboard({ src, artboard, stateMachine, size, bleed = 0, fit = "contain", bind = true, properties, darkThemeProperty, trigger = null, onReady, ref, label, className = "", style }: ArtboardProps) {
  const layout = useMemo(() => new Layout({ fit: FITS[fit], alignment: Alignment.Center }), [fit]);
  // The app's `.riv` files are downloaded and parsed once (see `riveCache.ts`): use that copy rather than fetching it again.
  const source = riveSource(src);
  const { rive, canvas, RiveComponent } = useRive({ ...source, artboard, stateMachine, autoplay: true, autoBind: bind, layout });
  const { theme } = useTheme();

  // The box keeps the artboard's shape. The caller's size holds it before the file has loaded;
  // after that the file's own bounds are read.
  const bounds = rive?.bounds;
  const shapeWidth = size?.width ?? (bounds ? bounds.maxX - bounds.minX : 0);
  const shapeHeight = size?.height ?? (bounds ? bounds.maxY - bounds.minY : 0);
  const shaped = shapeWidth > 0 && shapeHeight > 0;

  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  });
  useEffect(() => {
    if (rive) readyRef.current?.(rive);
  }, [rive]);

  useEffect(() => {
    if (!rive || !canvas || !bleed || !shaped) return;
    return applyArtboardBleed(rive, canvas, { width: shapeWidth, height: shapeHeight }, bleed, () => FITS[fit]);
  }, [rive, canvas, bleed, shaped, shapeWidth, shapeHeight, fit]);

  const wanted = JSON.stringify(properties ?? {});
  useEffect(() => {
    const instance = rive?.viewModelInstance;
    if (!rive || !instance) return;
    for (const [name, value] of Object.entries(JSON.parse(wanted) as Record<string, number | boolean | string>)) {
      try {
        const property = typeof value === "number" ? instance.number(name) : typeof value === "boolean" ? instance.boolean(name) : instance.string(name);
        if (property) (property as { value: typeof value }).value = value;
      } catch {
        // The artboard has no such property: leave it be.
      }
    }
    // Nothing is animating when only a property changed, so redraw explicitly.
    rive.drawFrame();
  }, [rive, wanted]);

  useEffect(() => {
    if (!rive || !darkThemeProperty) return;
    const dark = rive.viewModelInstance?.boolean(darkThemeProperty);
    if (dark) dark.value = theme === "dark";
  }, [rive, darkThemeProperty, theme]);

  const triggerId = trigger?.id;
  const triggerName = trigger?.name;
  useEffect(() => {
    if (!rive || triggerId === undefined || !triggerName) return;
    fireNamed(rive, triggerName, stateMachine);
  }, [rive, triggerId, triggerName, stateMachine]);

  useImperativeHandle(ref, () => ({ fire: (name) => rive && fireNamed(rive, name, stateMachine), rive }), [rive, stateMachine]);

  // A canvas that reaches past its box by the bleed, or one that exactly fills it.
  const canvasBox: CSSProperties = bleed && shaped ? artboardBleedBox({ width: shapeWidth, height: shapeHeight }, bleed) : { left: 0, top: 0, width: "100%", height: "100%" };
  return (
    <div role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`pointer-events-none relative ${className}`} style={{ aspectRatio: shaped ? `${shapeWidth} / ${shapeHeight}` : undefined, ...style }}>
      {/* A `style`, not a `className`: `RiveComponent` drops its `style` whenever it has a `className`. */}
      <RiveComponent aria-hidden style={{ position: "absolute", pointerEvents: "none", ...canvasBox }} />
    </div>
  );
}
