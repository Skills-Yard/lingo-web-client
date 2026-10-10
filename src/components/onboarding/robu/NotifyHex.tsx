"use client";

import { useEffect, type CSSProperties } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  NOTIFY_ARTBOARD,
  NOTIFY_STATE_MACHINE,
  NOTIFY_VIEW_MODEL,
  NOTIFY_TRIGGER,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** Lets the screen finish fading in before Hex and the popup come in. */
const SHOW_DELAY_MS = 300;

/**
 * Hex with the notification-permission popup (the "HEX_Notify" artboard):
 * fires `show` once the screen has faded in. There's no `hide` to fire on
 * the way out — the screen crossfades away instead.
 */
export function NotifyHex({ className, style }: { className?: string; style?: CSSProperties }) {
  const { RiveComponent, ready, fireTrigger } = useHexRive(
    LAYOUT,
    NOTIFY_STATE_MACHINE,
    NOTIFY_ARTBOARD,
    NOTIFY_VIEW_MODEL,
  );

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => fireTrigger(NOTIFY_TRIGGER.show), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, fireTrigger]);

  return (
    <div aria-hidden className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
