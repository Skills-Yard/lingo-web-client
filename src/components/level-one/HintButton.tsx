"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const SIZE = 58;
const GAP = 10;
const SLIDE = { type: "spring", stiffness: 220, damping: 26 } as const;

/**
 * The hint button that sits left of Check. Its slot animates its width, so the
 * button beside it (flex-1) narrows to make room as the hint slides in, and
 * widens back to the centre when the hint leaves.
 */
export function HintButton({ visible, onPress, count }: { visible: boolean; onPress: () => void; count: number }) {
  return (
    <motion.div
      initial={{ width: 0, marginRight: 0, opacity: 0, x: -24 }}
      animate={visible ? { width: SIZE, marginRight: GAP, opacity: 1, x: 0 } : { width: 0, marginRight: 0, opacity: 0, x: -24 }}
      transition={SLIDE}
      className="relative shrink-0"
      style={{ height: SIZE, pointerEvents: visible ? "auto" : "none" }}
    >
      <motion.button
        type="button"
        aria-label={`Hint, ${count} left`}
        tabIndex={visible ? 0 : -1}
        onClick={onPress}
        whileTap={{ scale: 0.94 }}
        className="relative flex cursor-pointer items-center justify-center border-[#DFE3E8] bg-white pb-1 outline-none focus-visible:ring-2 focus-visible:ring-[#FF8D42] dark:border-[#0B0D11] dark:bg-[#22262E]"
        style={{ width: SIZE, height: SIZE, borderWidth: "1.5px 1.5px 4px 1.5px", borderStyle: "solid", borderRadius: 18 }}
      >
        <Lightbulb className="h-7 w-7 text-[#FF8D42]" strokeWidth={1.98} />
        <span
          aria-hidden
          className="absolute -top-[7px] left-[42px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#FF8D42] text-[11px] leading-[14px] font-bold tracking-[0.2px] text-white dark:border-[#0F1F26]"
        >
          {count}
        </span>
      </motion.button>
    </motion.div>
  );
}
