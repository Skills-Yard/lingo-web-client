"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { WIDGET_ARTBOARD, WIDGET_STATE_MACHINE } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/**
 * The "HEX_Widget" artboard: Hex's own home-screen widget, drawn into the empty
 * space of the mockup card. Its `Widget_SM` just plays — no inputs.
 */
export function StreakWidgetHex({ className }: { className?: string }) {
  const { RiveComponent } = useHexRive(LAYOUT, WIDGET_STATE_MACHINE, WIDGET_ARTBOARD);

  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
