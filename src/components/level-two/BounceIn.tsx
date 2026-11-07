"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** A beat after the line ends, then each card follows the one before it by this much. */
const FIRST_DELAY_S = 0.2;
const STAGGER_S = 0.15;
/** Low damping: the card overshoots its size and place, then settles. */
const POP = { type: "spring", stiffness: 360, damping: 13 } as const;

const HIDDEN = { opacity: 0, scale: 0.5, y: 40 };
const SHOWN = { opacity: 1, scale: 1, y: 0 };

/**
 * One answer that bounces in (`index` is its place, so they come one by one) once
 * `shown` turns on. Until then it is invisible and cannot be tapped.
 */
export function BounceIn({ index, shown, className, children }: { index: number; shown: boolean; className?: string; children: ReactNode }) {
  const delay = FIRST_DELAY_S + index * STAGGER_S;
  return (
    <motion.div
      initial={HIDDEN}
      animate={shown ? SHOWN : HIDDEN}
      transition={shown ? { default: { ...POP, delay }, opacity: { duration: 0.2, delay } } : { duration: 0 }}
      style={{ pointerEvents: shown ? "auto" : "none" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
