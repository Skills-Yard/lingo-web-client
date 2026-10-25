"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Fredoka, Inter, Poppins } from "next/font/google";
import { Sparkle, X } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";

const fredoka = Fredoka({ subsets: ["latin"], weight: "600" });
const inter = Inter({ subsets: ["latin"], weight: "600" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

/** How long the popup stays open when nobody closes it. */
const AUTO_CLOSE_MS = 3000;

/** The gem with its burst of confetti, and the gem alone (from the level images). */
const GEM_BURST_SRC = "/images/level-one/gem-burst.png";
const GEM_SRC = "/images/level-one/gem.png";

/**
 * "Congratulations! +10 XP, 1 Gem" — the reward popup for finishing the game,
 * laid out on its Figma card (356 x 494, every part at its own spot). It closes
 * itself after `AUTO_CLOSE_MS`; a bar along the bottom of the card counts that
 * time down. Fills its (positioned) parent.
 */
export function GemPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  const close = () => {
    playClickSound();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gem-popup"
          role="dialog"
          aria-label="Congratulations, you won 1 gem"
          className="pointer-events-auto absolute inset-0 z-[300] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="relative h-[494px] w-[356px] max-w-full shrink-0 overflow-hidden rounded-[32px] bg-white text-[#444444] shadow-[0_16px_48px_rgba(0,0,0,0.25)] dark:bg-[#1A1C22] dark:text-white"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-6 right-6 flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 transition-transform active:scale-95 dark:border-white/15"
            >
              <X className="h-[22px] w-[22px]" strokeWidth={1.4} />
            </button>

            <span
              className={`${fredoka.className} absolute inset-x-0 top-[22px] text-center text-[32px] leading-7 font-semibold tracking-[-0.1px] text-[#FF8D42]`}
            >
              +10 XP
            </span>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GEM_BURST_SRC}
              alt=""
              draggable={false}
              className="absolute top-[63px] left-1/2 h-[156px] w-[235px] -translate-x-1/2 object-contain"
            />

            <h2
              className={`${inter.className} absolute inset-x-0 top-[219px] text-center text-[32px] leading-[134%] font-semibold`}
            >
              Congratulations!
            </h2>

            <span className="absolute top-[280px] left-1/2 flex h-[63.61px] w-[154px] -translate-x-1/2 items-center justify-center rounded-lg bg-[#E9F8F4] px-3 py-2 dark:bg-[#0F2B28]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GEM_SRC} alt="" draggable={false} className="h-[38.99px] w-[32.14px] -rotate-[19.93deg] object-contain" />
              <span className={`${poppins.className} w-[73px] text-[24px] leading-8 font-semibold`}>1 Gem</span>
            </span>

            <span aria-hidden className="absolute top-[368px] left-1/2 flex -translate-x-1/2 items-center gap-2.5">
              <span className="h-0 w-[66px] border-t-2 border-black/8 dark:border-white/15" />
              <Sparkle className="h-[18px] w-[18px] text-[#B8BCC4] dark:text-white/40" strokeWidth={1.5} />
              <span className="h-0 w-[66px] border-t-2 border-black/8 dark:border-white/15" />
            </span>

            <p
              className={`${poppins.className} absolute top-[410px] left-1/2 w-[265px] -translate-x-1/2 text-center text-[14px] leading-5 font-medium`}
            >
              You won 1 Gem as you followed the given command.
            </p>

            {/* The countdown to the popup closing itself: drains left to right. */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-[#04ACAB]/20">
              <motion.div
                className="h-full origin-left bg-primary"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
