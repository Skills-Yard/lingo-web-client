"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * What stands where Hex does beside his speech bubbles (`HexBubble`), when a route puts
 * something else there: the 3D routes put the 3D character's face. It fills Hex's
 * slot and takes what it needs (the voice) from `useLevelVoice`. Where it is set there is
 * normally no speech bubble: the stand-in stands alone (the Sequence's 3D screens read their
 * lines aloud); `HexStandInKeepsBubble` brings the bubble back, beside the stand-in, for a
 * route whose screens are read (the Variable module). `null`, the default, is Hex with his bubble.
 */
const HexStandInContext = createContext<ReactNode>(null);

export const HexStandInProvider = HexStandInContext.Provider;

export const useHexStandIn = () => useContext(HexStandInContext);

/** Whether the stand-in has its speech bubble beside it (default: it does not). */
const HexStandInKeepsBubbleContext = createContext(false);

export const HexStandInKeepsBubble = HexStandInKeepsBubbleContext.Provider;

export const useStandInKeepsBubble = () => useContext(HexStandInKeepsBubbleContext);
