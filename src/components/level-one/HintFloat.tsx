"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { motion, useAnimationControls } from "framer-motion";

const FLIPS = 2;
const FLIP_S = 1.2;
/** Hex sets off this far into the flip, so he arrives as the spin stops. */
const HEX_CUE = 0.65;
/** Without the spin (the list of options): how long the card's fill takes, in seconds. */
export const FILL_S = 0.8;

/**
 * Wraps the card the hint points at. When `active` turns on it scales up and
 * flips twice on its Y axis (unless `spin` is off, when the card only waits out its fill), settles back into place, then floats until
 * `active` turns off (an option got picked), when it comes to rest.
 */
export function HintFloat({ active, className, children, onFlipEnd, spin = true }: { active: boolean; className?: string; children: ReactNode; onFlipEnd?: () => void; spin?: boolean }) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (!active) {
      void controls.start({ scale: 1, y: 0, transition: { duration: 0.25 } });
      return;
    }
    let cancelled = false;
    let cueTimer: number | undefined;
    const run = async () => {
      const cueS = (spin ? FLIP_S : FILL_S) * HEX_CUE;
      cueTimer = window.setTimeout(() => onFlipEnd?.(), cueS * 1000);
      if (spin) {
        await controls.start({
          scale: 1.15,
          rotateY: 360 * FLIPS,
          transition: { rotateY: { duration: FLIP_S, ease: [0.45, 0, 0.25, 1] }, scale: { duration: FLIP_S * 0.6, ease: "easeInOut" } },
        });
      } else {
        // No spin or scale: the card's own fill plays, then the float starts.
        await new Promise((resolve) => window.setTimeout(resolve, FILL_S * 1000));
      }
      if (cancelled) return;
      if (spin) {
        // 2 full turns look identical to 0, so reset the angle unseen.
        controls.set({ rotateY: 0 });
        await controls.start({ scale: 1, transition: { duration: 0.6, ease: [0.45, 0, 0.25, 1] } });
        if (cancelled) return;
      }
      void controls.start({
        y: [0, -8, 0],
        transition: { duration: 2.4, ease: "easeInOut", repeat: Infinity },
      });
    };
    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(cueTimer);
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFlipEnd is only read when the flip ends
  }, [active, controls, spin]);

  return (
    <motion.div
      animate={controls}
      style={{ transformPerspective: 800 }}
      className={`${className ?? ""} ${active ? "relative z-10" : ""}`}
    >
      {children}
    </motion.div>
  );
}
