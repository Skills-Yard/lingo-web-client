"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Target, X } from "lucide-react";
import { BoxLottie } from "@/components/instructions-intro/BoxLottie";
import { LevelOneShell } from "./LevelOneShell";
import { playClickSound } from "@/components/onboarding/clickSound";

const REVEAL = {
  subject: "PROGRAMMER",
  modalHeading: "Programmer",
  modalTitle: "is a problem solver.",
  description:
    "A programmer breaks down complex problems into small steps using logic and creativity.",
  remember: "Great code starts with a great way of thinking.",
} as const;

const BRAND_GRADIENT = "bg-linear-to-b from-[#00B8A9] to-[#1187B2] bg-clip-text text-transparent";

/**
 * `/level-one` — the first screen of Module 1: "Before we write code, let's
 * learn how programmers think", with a tap-to-reveal card whose modal explains
 * what a programmer is.
 */
export function LevelOneScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <LevelOneShell
      step={1}
      onContinue={onContinue ?? (() => router.push("/level-one/2"))}
      overlay={
        <AnimatePresence>
          {modalOpen && <RevealSheet onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
      }
    >
      {/* Positions follow the 390x844 design frame: illustration at 103px
        (20px under the 83px header), heading 13px under it, card 32px under
        the heading. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/level-one/programmer.png"
        alt=""
        draggable={false}
        className="mt-5 h-[258px] w-[310px] max-w-full shrink-0 object-contain"
      />

      <h1 className="relative mt-[13px] h-24 w-[264px] shrink-0 translate-x-[3px] text-[24px] leading-[1.34] font-semibold text-[#444444] dark:text-white">
        Before we write code, let’s learn how <span className="text-brand-gradient">programmer think.</span>
        <svg
          aria-hidden
          viewBox="0 0 14 16"
          className="absolute top-[52px] left-[210px] h-4 w-3.5 fill-none stroke-[#1187B2]"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M1 1v8M13 7L6 8M9 15L5 9" />
        </svg>
      </h1>

      <RevealCard onOpen={() => setModalOpen(true)} />
    </LevelOneShell>
  );
}

/** The "Tap to reveal" card: a front panel over two tilted sheets. */
function RevealCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        playClickSound();
        onOpen();
      }}
      className="group relative mt-8 block h-[176px] w-[318px] max-w-full shrink-0 cursor-pointer text-left transition-transform active:scale-[0.98]"
      aria-label={`Tap to reveal about ${REVEAL.subject}`}
    >
      <span aria-hidden className="absolute top-1/2 left-1/2 h-[169px] w-[312px] -translate-x-[calc(50%+8px)] -translate-y-[calc(50%+22px)] rotate-[8deg] rounded-[10px] bg-[#E7F0F8] dark:bg-white/5" />
      <span aria-hidden className="absolute top-1/2 left-1/2 h-[170px] w-[324px] -translate-x-[calc(50%+3px)] -translate-y-[calc(50%+14px)] rotate-[4deg] rounded-[10px] bg-[#A9D8FA] dark:bg-white/10" />
      <span aria-hidden className="absolute top-1/2 left-1/2 h-[137px] w-[291px] -translate-x-[calc(50%+26px)] -translate-y-[calc(50%+17px)] -rotate-[5deg] rounded-[10px] bg-[#D0EEFC] dark:bg-white/5" />
      <span className="absolute inset-0 rounded-[10px] border border-white bg-[#F2F7FE] dark:border-white/10 dark:bg-[#15181E]">
        {/* Box and text sit together as one group, centred in the card. The
          animation has empty margin inside its frame, so it's pulled in
          toward the text. */}
        <span className="absolute inset-0 flex items-center justify-start pl-1">
          <span className="-mr-3 block h-56 w-44 shrink-0">
            <BoxLottie loop className="h-full w-full" />
          </span>
          <span className="flex flex-col gap-[6px] text-[14px] leading-[19px] font-medium">
            <span className="text-[#444444] dark:text-white">Tap to reveal</span>
            <span className="text-[#92959F]">about</span>
            <span className={`font-semibold ${BRAND_GRADIENT}`}>{REVEAL.subject}</span>
          </span>
        </span>
      </span>
    </button>
  );
}

/** Past this much downward drag (px) or flick speed (px/s), the sheet closes. */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 500;

/**
 * The popup the card opens — a 390x508 bottom sheet (32px top corners) that
 * slides up from the bottom edge and can be dragged back down to dismiss.
 */
function RevealSheet({ onClose }: { onClose: () => void }) {
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) onClose();
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[58dvh] min-h-[460px] max-h-dvh w-full touch-none flex-col items-center overflow-hidden rounded-t-[32px] bg-white pt-6 pb-8 text-center dark:bg-[#1E2028]"
      >
        <button
          type="button"
          onClick={onClose}
          onPointerDownCapture={(e) => e.stopPropagation()}
          aria-label="Close"
          className="absolute top-6 right-6 flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95 dark:border-white/15 dark:text-white/70"
        >
          <X className="h-5 w-5" strokeWidth={1.4} />
        </button>

        <span className="block h-[min(150px,18dvh)] aspect-square shrink-0">
          <BoxLottie loop={false} className="h-full w-full" />
        </span>

        <h2 className="-mt-2 w-[238px] shrink-0 text-[24px] leading-[1.34] font-semibold">
          <span className="bg-linear-to-b from-[#00B8A9] to-[#1386B3] bg-clip-text text-transparent">
            {REVEAL.modalHeading}
            <br />
            {REVEAL.modalTitle}
          </span>
        </h2>

        <div aria-hidden className="mt-4 flex h-[18px] w-[170px] shrink-0 items-center justify-between">
          <span className="h-0.5 w-[66px] bg-black/8 dark:bg-white/15" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1386B3" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
          </svg>
          <span className="h-0.5 w-[66px] bg-black/8 dark:bg-white/15" />
        </div>

        <p className="mt-4 w-[338px] max-w-[calc(100%-32px)] shrink-0 text-[14px] leading-[1.4] font-normal text-[#444444] dark:text-[#A8AABF]">
          {REVEAL.description}
        </p>

        <div className="mt-8 flex h-[85px] w-[280px] shrink-0 items-center gap-[22px] rounded-lg border border-black/8 px-3.5 py-3 text-left dark:border-white/10">
          <span className="flex h-[53px] w-[53px] shrink-0 items-center justify-center rounded-full bg-[#B286FD]/18 text-[#B286FD]">
            <Target className="h-7 w-7" strokeWidth={1.6} />
          </span>
          <span className="flex w-[175px] flex-col gap-1">
            <span className="text-[14px] leading-[1.4] font-medium text-[#B286FD]">REMEMBER:</span>
            <span className="text-[12px] leading-[1.4] font-medium text-[#444444] dark:text-[#B8BACE]">
              {REVEAL.remember}
            </span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
