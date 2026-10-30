"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { chargeBatteryScreen, useBattery } from "@/components/home/batteryStore";
import { useTheme } from "@/context/ThemeContext";
import { flashBattery, getBatteryHost, resizeBattery, writeBattery, writeBatteryTheme } from "@/lib/rive/batteryHost";
import { BATTERY } from "@/lib/rive/runtime";

type PersistentBatteryProps = {
  /** The lesson screen this is on. Arriving at a screen that hasn't been paid
   * for yet spends its share of battery, and flashes it. Leave out where the
   * battery is only shown. */
  step?: number;
  /** Give it a width; the height follows the artboard. */
  className?: string;
  /** Shows this fill (0-100) instead of the learner's, for a screen that
   * animates the battery filling itself. */
  level?: number;
};

/** The session's one battery (see `batteryHost`), moved into this slot, showing
 * the learner's `useBattery()` level. */
export function PersistentBattery({ step, className = "", level: shownLevel }: PersistentBatteryProps) {
  const slot = useRef<HTMLDivElement>(null);
  const battery = useBattery();
  const level = shownLevel ?? battery.level;
  const { unlimited } = battery;
  const { theme } = useTheme();
  const darkTheme = theme === "dark";

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getBatteryHost();
    element.appendChild(shared.element);
    resizeBattery();
    const observer = new ResizeObserver(resizeBattery);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    writeBattery({ level, unlimited });
  }, [level, unlimited]);

  useEffect(() => {
    writeBatteryTheme(darkTheme);
  }, [darkTheme]);

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
