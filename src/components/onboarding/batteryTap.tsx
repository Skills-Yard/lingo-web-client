"use client";

import { createContext, useContext } from "react";

/**
 * What a tap on the battery (see `BatteryMenu`) does where a route has its own use for it: the
 * 3D Sequence screens open the mentor picker. `null`, the default, is the Energy screen.
 */
const BatteryTapContext = createContext<(() => void) | null>(null);

export const BatteryTapProvider = BatteryTapContext.Provider;

export const useBatteryTap = () => useContext(BatteryTapContext);
