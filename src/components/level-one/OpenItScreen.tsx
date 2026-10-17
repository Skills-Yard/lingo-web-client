"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { OnboardingHex } from "./FeedbackPanel";
import { playClickSound } from "@/components/onboarding/clickSound";
import { LevelOneShell } from "./LevelOneShell";

/**
 * `/level-one/6` — "So, giving instruction is same as giving commands." with
 * Hex beside the heading and a tap-to-open "Open it" card. Opening it shows
 * the "Congratulations! 1 Gem" popup.
 */
export function OpenItScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <LevelOneShell
      step={6}
      onBack={() => router.push("/level-one/5")}
      onContinue={onContinue ?? (() => router.push("/level-one/7"))}
      overlay={
        <AnimatePresence>
          {popupOpen && <GemPopup onClose={() => setPopupOpen(false)} />}
        </AnimatePresence>
      }
    >
      <h1 className="mt-9 w-full max-w-[358px] shrink-0 pl-10 text-[24px] leading-8 font-semibold text-[#2C2C2C] dark:text-white">
        So, giving instruction is same as giving <span className="text-[#04ACAB]">commands.</span>
      </h1>

      <div aria-hidden className="pointer-events-none mt-1 mr-2 h-[150px] w-[180px] shrink-0 self-end">
        <OnboardingHex entryKey="open-it" />
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          setPopupOpen(true);
        }}
        aria-label="Open it"
        className="mt-5 block w-[340px] max-w-full shrink-0 cursor-pointer transition-transform active:scale-[0.97]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/level-one/open-it.png" alt="" draggable={false} className="h-auto w-full select-none" />
      </button>
    </LevelOneShell>
  );
}

/** The reward popup: a centred card over a dimmed screen. */
function GemPopup({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[310px] flex-col items-center rounded-[24px] bg-white px-5 pt-6 pb-6 text-center dark:bg-[#1E2028]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95 dark:border-white/15 dark:text-white/70"
        >
          <X className="h-5 w-5" strokeWidth={1.4} />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/level-one/gem-burst.png" alt="" draggable={false} className="mt-6 h-auto w-[190px]" />

        <h2 className="mt-3 text-[28px] leading-[1.3] font-semibold text-[#2C2C2C] dark:text-white">Congratulations!</h2>

        <div className="relative mt-5 flex h-[56px] w-full items-center justify-center">
          <span className="flex h-full items-center gap-2 rounded-lg bg-[#04ACAB]/10 px-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/level-one/gem.png" alt="" draggable={false} className="h-[30px] w-auto" />
            <span className="text-[20px] font-semibold text-[#2C2C2C] dark:text-white">1 Gem</span>
          </span>
        </div>

        <div className="relative mt-3 flex h-[44px] w-full items-center">
          <div aria-hidden className="pointer-events-none absolute -bottom-4 -left-3 h-[104px] w-[116px]">
            <OnboardingHex entryKey="popup" />
          </div>
          <div aria-hidden className="ml-auto flex w-[170px] items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1386B3" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
            </svg>
            <span className="h-0.5 flex-1 bg-black/8 dark:bg-white/15" />
          </div>
        </div>

        <p className="mt-4 w-[300px] max-w-full text-[13px] leading-[1.45] font-normal text-[#444444] dark:text-[#A8AABF]">
          You won 1 Gem as you followed the given command.
        </p>
      </motion.div>
    </motion.div>
  );
}
