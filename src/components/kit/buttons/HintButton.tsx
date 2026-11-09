"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { feelTap } from "../feel";

export type HintButtonProps = {
  onPress: () => void;
  /** The number on the badge: hints left. */
  count?: number;
  /** Its side (px, it is square). */
  size?: number;
  disabled?: boolean;
  className?: string;
};

/** The lightbulb that gives a hint: a square 3D button with a count badge, which sinks when pressed. */
export function HintButton({ onPress, count = 1, size = 64, disabled = false, className = "" }: HintButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={`Hint, ${count} left`}
      disabled={disabled}
      onClick={() => {
        feelTap();
        onPress();
      }}
      whileTap={{ scale: 0.95, y: 4, boxShadow: "0 0px 0 0 rgba(0,0,0,0)" }}
      transition={{ type: "spring", stiffness: 500, damping: 14 }}
      className={`pointer-events-auto relative flex shrink-0 cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-[#DFE3E8] bg-white shadow-[0_4px_0_#BFC6CF] outline-none focus-visible:ring-2 focus-visible:ring-[#FF8D42] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#0B0D11] dark:bg-[#22262E] dark:shadow-[0_4px_0_#05070A] ${className}`}
      style={{ width: size, height: size }}
    >
      <Lightbulb aria-hidden className="size-[48%] text-[#FF8D42]" strokeWidth={1.98} />
      <span aria-hidden className="absolute -top-[7px] -right-[6px] flex size-[22px] items-center justify-center rounded-full border-2 border-white bg-[#FF8D42] text-[11px] leading-[14px] font-bold text-white dark:border-[#0F1F26]">
        {count}
      </span>
    </motion.button>
  );
}
