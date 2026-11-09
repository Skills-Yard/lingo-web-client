"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle, X } from "lucide-react";
import { GemRive } from "@/components/ui/GemRive";
import { feelTap } from "../feel";

export type RewardPopupProps = {
  open: boolean;
  onClose: () => void;
  /** The XP won, shown big in orange. Leave out for none. */
  xp?: number;
  /** The gems won, in a chip under the title. Leave out (or 0) for none. */
  gems?: number;
  title?: string;
  message?: string;
  /** Closes itself after this many ms, with a bar along the bottom counting down. `null`: stays until closed. */
  autoCloseMs?: number | null;
};

/**
 * "Congratulations! +10 XP, 1 Gem": the reward card that pops over a screen with a dimmed backdrop.
 * It fills the positioned box it is in, so put it in the frame's `overlay`.
 */
export function RewardPopup({ open, onClose, xp = 10, gems = 1, title = "Congratulations!", message, autoCloseMs = 3000 }: RewardPopupProps) {
  useEffect(() => {
    if (!open || autoCloseMs === null) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  const close = () => {
    feelTap();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="kit-reward"
          role="dialog"
          aria-label={title}
          className="pointer-events-auto absolute inset-0 z-[300] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            className="relative flex w-[356px] max-w-full flex-col items-center gap-3 overflow-hidden rounded-[32px] bg-white px-6 pt-6 pb-9 text-[#444444] shadow-[0_16px_48px_rgba(0,0,0,0.25)] dark:bg-[#1A1C22] dark:text-white"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-5 right-5 flex size-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 transition-transform active:scale-95 dark:border-white/15"
            >
              <X aria-hidden className="size-[22px]" strokeWidth={1.4} />
            </button>
            {xp > 0 && <span className="pt-1 text-[32px] leading-8 font-semibold tracking-[-0.1px] text-[#FF8D42]">+{xp} XP</span>}
            <div className="size-[156px]">
              <GemRive className="size-full" />
            </div>
            <h2 className="text-center text-[32px] leading-[134%] font-semibold">{title}</h2>
            {gems > 0 && (
              <span className="flex h-[64px] min-w-[154px] items-center justify-center gap-2 rounded-lg bg-[#E9F8F4] px-3 py-2 dark:bg-[#0F2B28]">
                <GemRive className="h-[39px] w-[32px] -rotate-[19.93deg]" />
                <span className="text-[24px] leading-8 font-semibold">
                  {gems} {gems === 1 ? "Gem" : "Gems"}
                </span>
              </span>
            )}
            {message && (
              <>
                <span aria-hidden className="flex items-center gap-2.5">
                  <span className="h-0 w-[66px] border-t-2 border-black/8 dark:border-white/15" />
                  <Sparkle className="size-[18px] text-[#B8BCC4] dark:text-white/40" strokeWidth={1.5} />
                  <span className="h-0 w-[66px] border-t-2 border-black/8 dark:border-white/15" />
                </span>
                <p className="w-[265px] max-w-full text-center text-[14px] leading-5 font-medium">{message}</p>
              </>
            )}
            {autoCloseMs !== null && (
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-[#04ACAB]/20">
                <motion.div className="h-full origin-left bg-primary" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: autoCloseMs / 1000, ease: "linear" }} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
