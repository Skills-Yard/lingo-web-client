"use client";

import { useCallback, useState, type ReactNode } from "react";
import { addBatteryUnits, batteryFull } from "@/components/home/batteryStore";
import { BATTERY_UNITS, noteGameWin } from "@/lib/moduleStreak";
import { chargeBattery } from "@/lib/rive/batteryHost";
import { GemPopup } from "./GemPopup";

/**
 * The end of a game where Hex reaches the battery: `win()` opens the
 * "Congratulations!" popup; when it closes, the battery is claimed (+1 unit,
 * every time Hex reaches it) and the Battery Doctor plays over the screen, so the
 * learner sees the unit land. `then` waits for the Doctor to finish, or runs at
 * once if there is nothing to play (the battery was already full).
 *
 * With `rationed` (the Sequence module's games) only every third win does any
 * of this; the others skip the popup and the battery and just go on.
 *
 * Render `popup` among the screen's overlays.
 */
export function useBatteryClaim(then?: () => void, { rationed = false }: { rationed?: boolean } = {}): { win: () => void; popup: ReactNode } {
  const [open, setOpen] = useState(false);

  // `rationed`: only every third win brings the popup and the battery; the others just go on.
  const win = useCallback(() => {
    if (rationed && !noteGameWin()) {
      then?.();
      return;
    }
    setOpen(true);
  }, [rationed, then]);

  const close = useCallback(() => {
    setOpen(false);
    // Already full: nothing lands, so neither the Doctor nor the header battery's charge is played.
    if (batteryFull()) {
      then?.();
      return;
    }
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
