"use client";

import { motion } from "framer-motion";
import { Check, Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { Markup } from "../markup";

export type TipTone = "tip" | "info" | "success" | "warning";

const LOOK: Record<TipTone, { Icon: LucideIcon; card: string; icon: string }> = {
  tip: { Icon: Lightbulb, card: "bg-[#F1EEFF] dark:bg-[#23204A]", icon: "text-[#6D4FE0] dark:text-[#A79BFF]" },
  info: { Icon: Info, card: "bg-[#E5EFFD] dark:bg-[#15233A]", icon: "text-[#2A66DB] dark:text-[#7FB0FF]" },
  success: { Icon: Check, card: "bg-[#E3F6F3] dark:bg-[#0F2B28]", icon: "text-[#01A17F]" },
  warning: { Icon: TriangleAlert, card: "bg-[#FFF3DE] dark:bg-[#2A2218]", icon: "text-[#E07B1F]" },
};

export type TipCardProps = {
  /** The sentence; `*words*` in teal, `**bold**`. */
  text: string;
  tone?: TipTone;
  className?: string;
};

/** A short note on a coloured card with an icon — what Hex's board screens say in place of a speech bubble. */
export function TipCard({ text, tone = "tip", className = "" }: TipCardProps) {
  const { Icon, card, icon } = LOOK[tone];
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 ${card} ${className}`}
    >
      <Icon aria-hidden className={`size-6 shrink-0 ${icon}`} />
      <p className="text-[14px] leading-5 font-medium text-[#444444] dark:text-white">
        <Markup text={text} />
      </p>
    </motion.div>
  );
}
