"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { chargeBatteryScreen, useBattery } from "@/components/home/batteryStore";
import { flashBattery, getBatteryHost, writeBattery } from "@/lib/rive/batteryHost";
import { BATTERY } from "@/lib/rive/runtime";

type PersistentBatteryProps = {
  /** The lesson screen this is on. Arriving at a screen that hasn't been paid
   * for yet spends its share of battery, and flashes it. Leave out where the
   * battery is only shown. */
  step?: number;
  /** Give it a width; the height follows the artboard. */
  className?: string;
};

/** The session's one battery (see `batteryHost`), moved into this slot, showing
 * the learner's `useBattery()` level. */
export function PersistentBattery({ step, className = "" }: PersistentBatteryProps) {
  const slot = useRef<HTMLDivElement>(null);
  const { level, unlimited } = useBattery();

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getBatteryHost();
    element.appendChild(shared.element);
    shared.rive?.resizeDrawingSurfaceToCanvas();
    const observer = new ResizeObserver(() => shared.rive?.resizeDrawingSurfaceToCanvas());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    writeBattery({ level, unlimited });
  }, [level, unlimited]);

  useEffect(() => {
    if (step !== undefined && chargeBatteryScreen(step)) flashBattery();
  }, [step]);

  return (
    <div
      ref={slot}
      aria-hidden
      className={`pointer-events-none shrink-0 ${className}`}
      style={{ aspectRatio: `${BATTERY.width} / ${BATTERY.height}` }}
    />
  );
}
