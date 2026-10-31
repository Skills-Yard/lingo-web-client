"use client";

import { useEffect, useState } from "react";
import { motion, type Transition } from "framer-motion";
import { Lightbulb } from "lucide-react";

/** The space between the hint and the main button beside it. */
const GAP = 10;
/** The drop edge under the button (its `shadow-[0_4px_0_...]` below), which counts as part of its height. */
const EDGE = 4;

/** It pops in with a springy overshoot, standing where it will sit. */
const ENTER = { type: "spring", stiffness: 320, damping: 13 } as const;
/**
 * It leaves like a jelly: swells, squashes a little under its size, then folds
 * away into its bottom-left corner (the scale's origin), while the room it took
 * closes up beside it (see the slot's margin) and the main button grows into it.
 */
const EXIT_SCALE = [1, 1.2, 0.88, 0];
const EXIT: Transition = { duration: 0.6, times: [0, 0.22, 0.5, 1], ease: ["easeOut", "easeInOut", "easeIn"] };

/**
 * How big the hint is, as shares of the row it stands in (a square, so `width`
 * and `height` are the same length), and how far its bottom edge is lifted off
 * the row's bottom: set by the row so the hint is the same height as the main
 * button beside it, top to bottom.
 */
export type HintSize = { width: string; height: string; lift: string };

/**
 * The hint button that sits left of Check. Its slot never changes size: it
 * closes by pulling its own margin in (so the button is not squeezed), and the
 * button beside it (flex-1) takes the room as it goes, on the same 500ms
 * ease-out the main button's own width and height use, so the two move as one.
 * Opening is the same in reverse.
 */
export function HintButton({ visible, onPress, count, size }: { visible: boolean; onPress: () => void; count: number; size: HintSize }) {
  // The slot first renders closed and opens on the next frame, so the hint
  // arrives (and the button beside it makes room) instead of just being there.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const open = visible && armed;
  return (
    <div
      aria-hidden={!visible}
      // The slot is the button's width plus the gap, always; closed, a margin the
      // same size takes all of it back. Both ends are `calc(length + percent)` so
      // the transition runs between them. Above the main button, so it is seen
      // folding away over the room that button grows into.
      className="relative z-[1] shrink-0 transition-[margin-right] duration-500 ease-out"
      style={{
        width: `calc(${size.width} + ${GAP}px)`,
        height: size.height,
        bottom: size.lift,
        marginRight: open ? "calc(0px + 0%)" : `calc(-${GAP}px + -${size.width})`,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <motion.div
        className="absolute bottom-0 left-0"
        style={{ width: `calc(100% - ${GAP}px)`, height: "100%", originX: 0, originY: 1 }}
        initial={visible ? { scale: 0, opacity: 0 } : false}
        animate={visible ? { scale: 1, opacity: 1, transition: ENTER } : { scale: EXIT_SCALE, opacity: [1, 1, 1, 0], transition: EXIT }}
      >
        <motion.button
          type="button"
          aria-label={`Hint, ${count} left`}
          tabIndex={visible ? 0 : -1}
          onClick={onPress}
          // A normal border with a solid shadow edge under it. Pressed, the shadow goes
          // and the button sinks onto where it was, then bounces back.
          whileTap={{ scale: 0.95, y: 4, boxShadow: "0 0px 0 0 rgba(0,0,0,0)" }}
          transition={{ type: "spring", stiffness: 500, damping: 14 }}
          className="relative flex cursor-pointer items-center justify-center border-[#DFE3E8] bg-white shadow-[0_4px_0_#BFC6CF] outline-none focus-visible:ring-2 focus-visible:ring-[#FF8D42] dark:border-[#0B0D11] dark:bg-[#22262E] dark:shadow-[0_4px_0_#05070A]"
          style={{ width: "100%", height: `calc(100% - ${EDGE}px)`, borderWidth: "1.5px", borderStyle: "solid", borderRadius: 16 }}
        >
          <Lightbulb className="h-[48%] w-[48%] text-[#FF8D42]" strokeWidth={1.98} />
          <span
            aria-hidden
            className="absolute -top-[7px] -right-[6px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#FF8D42] text-[11px] leading-[14px] font-bold tracking-[0.2px] text-white dark:border-[#0F1F26]"
          >
            {count}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
