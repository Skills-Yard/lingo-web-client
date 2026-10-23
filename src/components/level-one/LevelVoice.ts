"use client";

import { createContext, useContext } from "react";

export type LevelVoice = {
  /** A clip of the screen's voiceover is audibly playing. */
  speaking: boolean;
  /** Which clip of the screen's voiceover is current (0-based). */
  clip: number;
  /** 0..1 — how much of the heading the voice has read (1 with no voice). */
  spoken: number;
};

/** The voiceover the shell is playing, for whatever on the screen reacts to
 * it — Hex talks while it plays. */
export const LevelVoiceContext = createContext<LevelVoice>({ speaking: false, clip: 0, spoken: 1 });

export const useLevelVoice = () => useContext(LevelVoiceContext);
