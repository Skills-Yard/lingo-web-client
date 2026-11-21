"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * What stands where Hex does beside his speech bubbles (`HexBubble`), when a route puts
 * something else there: the 3D Sequence screens put the 3D character's face. It fills Hex's
 * slot and takes what it needs (the voice) from `useLevelVoice`. Where it is set there is
 * no speech bubble: the stand-in stands alone. `null`, the default, is Hex with his bubble.
 */
const HexStandInContext = createContext<ReactNode>(null);

export const HexStandInProvider = HexStandInContext.Provider;

export const useHexStandIn = () => useContext(HexStandInContext);
