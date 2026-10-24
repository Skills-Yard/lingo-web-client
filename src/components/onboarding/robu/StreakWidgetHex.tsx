"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  WIDGET_ARTBOARD,
  WIDGET_FALLBACK_ASPECT,
  WIDGET_STATE_MACHINE,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/**
 * The "HEX_Widget" artboard: Hex's whole home-screen widget card, played by
 * `WidgetFull_SM` (no inputs). The box takes the artboard's own aspect ratio, so
 * `className` only has to set its width.
 */
export function StreakWidgetHex({ className }: { className?: string }) {
  const { rive, RiveComponent } = useHexRive(LAYOUT, WIDGET_STATE_MACHINE, WIDGET_ARTBOARD);
  const bounds = rive?.bounds;
  const aspect =
    bounds && bounds.maxY > bounds.minY
      ? (bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY)
      : WIDGET_FALLBACK_ASPECT;

  return (
    <div
      role="img"
      aria-label="Lingo's streak widget on your home screen"
      className={className}
      style={{ aspectRatio: aspect }}
    >
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
