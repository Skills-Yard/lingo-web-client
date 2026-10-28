"use client";

import { motion } from "framer-motion";

/** What the instruction did: slides up above Continue. */
export function ResultCard({ children }: { children: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="mx-auto mb-1 flex w-[calc(100%-32px)] max-w-[358px] items-center gap-3 rounded-xl bg-white p-2.5 shadow-[0_4px_14px_rgba(31,42,68,0.14)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/level-two/arm-thumb.png" alt="" draggable={false} className="h-[54px] w-[60px] shrink-0 rounded-lg bg-[#E8F1FB] object-cover" />
      <p className="text-[13px] leading-[18px] font-medium text-[#2C2C2C]">{children}</p>
    </motion.div>
  );
}
