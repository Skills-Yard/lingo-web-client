"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** The wave a right answer sends through the answers: how high (px) a card is lifted, at which beats, and how long one hop takes (s). */
const HOP = [0, -9, 0, -3, 0];
const HOP_TIMES = [0, 0.3, 0.62, 0.8, 1];
const HOP_S = 0.5;
/** How long after the check the first card hops, and how much later each next one does (s). */
const WAVE_START_S = 0.2;
const WAVE_STEP_S = 0.1;

/** When the card at `index` (in reading order: left to right, top to bottom) is reached by the wave, in seconds after the check (`start`: when the first one is, where the wave should not wait for the answers to rise). */
export const waveDelay = (index: number, start = WAVE_START_S) => start + index * WAVE_STEP_S;

/**
 * A wave through the answers: once `play` turns on, the card hops a little (a small hop, not the right answer's jump),
 * `delay` seconds later, so the cards hop one after another as a wave runs through them. It is as it was when `play`
 * turns off again (trying again). `className` sizes the wrapper in its row or grid.
 */
export function WaveBounce({ play, delay, className = "", children }: { play: boolean; delay: number; className?: string; children: ReactNode }) {
  return (
    <motion.div animate={play ? { y: HOP } : { y: 0 }} transition={play ? { duration: HOP_S, delay, times: HOP_TIMES, ease: "easeOut" } : { duration: 0 }} className={className}>
      {children}
    </motion.div>
  );
}
