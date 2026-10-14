"use client";

import { useEffect, useRef } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  DAYNIGHT_ARTBOARD,
  DAYNIGHT_STATE_MACHINE,
  DAYNIGHT_TRIGGERS,
  DAYNIGHT_VIEW_MODEL,
} from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });

/**
 * The "DayNight" artboard's `DayNight_SM`: picking Morning / Afternoon /
 * Evening / Night fires that time of day's trigger on the `DayNight` view model.
 */
export function DayNightHex({
  className,
  typing,
  selectedId,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing: number;
  selectedId: string | null;
}) {
  const { RiveComponent, ready, fireNow } = useHexRive(
    LAYOUT,
    DAYNIGHT_STATE_MACHINE,
    DAYNIGHT_ARTBOARD,
    DAYNIGHT_VIEW_MODEL,
  );

  // Only picks made while it's showing — never one from before it appeared.
  const lastTyping = useRef(typing);
  useEffect(() => {
    if (!ready || typing === lastTyping.current) return;
    lastTyping.current = typing;
    const trigger = selectedId ? DAYNIGHT_TRIGGERS[selectedId] : undefined;
    if (trigger) fireNow(trigger);
  }, [ready, typing, selectedId, fireNow]);

  return (
    <div aria-hidden className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
