"use client";

import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.BottomCenter });

/**
 * Hex pointing down at the Allow button (NotificationPermissionScreen): the
 * "HEX-Pointing" state machine plays for as long as the screen is up.
 */
export function NotificationFox({ className }: { className?: string }) {
  const { RiveComponent } = useHexRive(LAYOUT, HEX_STATE.pointing);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
