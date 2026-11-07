"use client";

import { useCallback, useState, type ReactNode } from "react";
import { addBatteryUnits } from "@/components/home/batteryStore";
import { BATTERY_UNITS } from "@/lib/moduleStreak";
import { chargeBattery } from "@/lib/rive/batteryHost";
import { GemPopup } from "./GemPopup";

/**
 * The end of a game where Hex reaches the battery: `win()` opens the
 * "Congratulations!" popup; when it closes, the battery is claimed (+1 unit,
 * every time Hex reaches it) and the Battery Doctor plays over the screen, so the
 * learner sees the unit land. `then` waits for the Doctor to finish, or runs at
 * once if there is nothing to play (the battery was already full).
 *
 * Render `popup` among the screen's overlays.
 */
export function useBatteryClaim(then?: () => void): { win: () => void; popup: ReactNode } {
  const [open, setOpen] = useState(false);

  const win = useCallback(() => setOpen(true), []);

  const close = useCallback(() => {
    setOpen(false);
    addBatteryUnits(BATTERY_UNITS, {
      celebrate: true,
      onCelebrated: () => {
        chargeBattery();
        then?.();
      },
    });
  }, [then]);

  return { win, popup: <GemPopup open={open} onClose={close} /> };
}
