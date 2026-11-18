"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";

interface LockedToastProps {
  notice: string | null;
}

export function LockedToast({ notice }: LockedToastProps) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-28 left-1/2 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#1E293B]/95 px-4 py-2 text-[11px] sm:text-xs font-semibold text-white shadow-xl backdrop-blur-sm"
        >
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{notice}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

