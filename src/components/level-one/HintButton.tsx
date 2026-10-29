"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

/** The space between the hint and the main button beside it. */
const GAP = 10;
/** The drop edge under the button (its `shadow-[0_4px_0_...]` below), which counts as part of its height. */
const EDGE = 4;
const SLIDE = { type: "spring", stiffness: 220, damping: 26 } as const;

/**
 * How big the hint is, as shares of the row it stands in (a square, so `width`
 * and `height` are the same length), and how far its bottom edge is lifted off
 * the row's bottom: set by the row so the hint is the same height as the main
 * button beside it, top to bottom.
 */
export type HintSize = { width: string; height: string; lift: string };

/**
 * The hint button that sits left of Check. Its slot animates its width, so the
 * button beside it (flex-1) narrows to make room as the hint slides in, and
 * widens back to the centre when the hint leaves.
 */
export function HintButton({ visible, onPress, count, size }: { visible: boolean; onPress: () => void; count: number; size: HintSize }) {
  return (
    <motion.div
      initial={{ width: 0, marginRight: 0, opacity: 0, x: -24 }}
      animate={visible ? { width: size.width, marginRight: GAP, opacity: 1, x: 0 } : { width: 0, marginRight: 0, opacity: 0, x: -24 }}
      transition={SLIDE}
      className="relative shrink-0"
      style={{ height: size.height, bottom: size.lift, pointerEvents: visible ? "auto" : "none" }}
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
  );
}
