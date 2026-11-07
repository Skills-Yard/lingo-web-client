"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { RiveProgressBar } from "@/components/ui/RiveProgressBar";
import type { CardPlace } from "./types";

export const LESSONS_PER_MODULE = 7;
export const MODULES = [
  { id: "m1", title: "Module 1 Programming Mindset", base: 2 },
  { id: "m2", title: "Module 2 Variables & Data Types", base: 0 },
  { id: "m3", title: "Module 3 Control Flow", base: 0 },
] as const;

export const CARD_FULL_H = 158;
export const CARD_COMPACT_H = 78;
export const CARD_TOP_Y = 0;
export const STACK_PEEK = 10;
export const STACK_SHRINK = 0.03;
export const STACK_VISIBLE = 2;
export const BOTTOM_GAP = 10;
export const HOME_BUTTON_BOTTOM = 24;
export const HOME_BUTTON_GAP = 10;

export const homeButtonBottom = (done: number) =>
  done === 0
    ? HOME_BUTTON_BOTTOM
    : BOTTOM_GAP + CARD_COMPACT_H + STACK_PEEK * Math.min(done - 1, STACK_VISIBLE) + HOME_BUTTON_GAP;

export const CARD_MOVE = { duration: 0.9, ease: [0.65, 0, 0.35, 1] } as const;

export const cardPlace = (index: number, done: number, areaH: number): CardPlace => {
  if (index >= done) {
    const queued = index - done;
    const depth = Math.min(queued, STACK_VISIBLE);
    return {
      y: CARD_TOP_Y + STACK_PEEK * depth,
      scale: 1 - STACK_SHRINK * depth,
      height: CARD_FULL_H,
      opacity: queued > STACK_VISIBLE ? 0 : 1,
      zIndex: 30 - queued,
    };
  }
  const rank = done - 1 - index;
  const depth = Math.min(rank, STACK_VISIBLE);
  return {
    y: areaH - CARD_COMPACT_H - BOTTOM_GAP - STACK_PEEK * depth,
    scale: 1 - STACK_SHRINK * depth,
    height: CARD_COMPACT_H,
    opacity: rank > STACK_VISIBLE ? 0 : 1,
    zIndex: 20 - rank,
  };
};

export function PythonLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/python-logo.png"
      alt="Python"
      draggable={false}
      width={351}
      height={313}
      className="-mx-9 -my-5 h-[118px] w-[132px] max-w-none select-none object-contain"
    />
  );
}

export function ModuleCard({
  title,
  progress,
  place,
  compact,
}: {
  title: string;
  progress: number;
  place: CardPlace;
  compact: boolean;
}) {
  const percent = (progress / LESSONS_PER_MODULE) * 100;
  const fadeOut = { duration: 0.3, ease: "easeOut" } as const;
  const fadeIn = { duration: 0.4, ease: "easeOut", delay: 0.4 } as const;

  return (
    <motion.div
      className="absolute top-0 box-border overflow-hidden rounded-lg border-b-[6px] border-[#BDBA99] bg-gradient-to-b from-white from-[30.82%] to-[#DCD5FE] shadow-[1px_1px_7.3px_1px_rgba(0,0,0,0.25)] will-change-transform dark:border-[#3a4a45] dark:from-[#1c2e36] dark:to-[#2b2a57]"
      style={{ left: 16, right: 16, transformOrigin: "50% 0%", zIndex: place.zIndex }}
      initial={false}
      animate={{ y: place.y, scale: place.scale, height: place.height, opacity: place.opacity }}
      transition={{ ...CARD_MOVE, opacity: { duration: 0.4 } }}
    >
      <motion.div
        className="absolute inset-0 flex items-center gap-2.5 p-[18px]"
        animate={{ opacity: compact ? 0 : 1 }}
        transition={compact ? fadeOut : fadeIn}
      >
        <div className="flex h-[116px] min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex h-[30px] items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
              <Code2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <span className="text-xs font-medium uppercase leading-[18px] text-[#666666] dark:text-white/60">
              Python Programming
            </span>
          </div>
          <h1 className="text-xl font-semibold leading-[1.2] text-[#1A1C22] dark:text-white">{title}</h1>
          <div className="flex h-[18px] items-center">
            <span className="w-[101px] shrink-0 text-xs font-medium leading-[18px]">
              {progress}/{LESSONS_PER_MODULE} completed
            </span>
            <RiveProgressBar value={percent} className="w-32 shrink-0" />
          </div>
        </div>
        <motion.div
          className="relative -mt-2 shrink-0"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <PythonLogo />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center gap-2.5 px-[18px]"
        animate={{ opacity: compact ? 1 : 0 }}
        transition={compact ? fadeIn : fadeOut}
        aria-hidden={!compact}
      >
        <div className="flex w-[229px] shrink-0 flex-col gap-2">
          <div className="flex h-6 items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-gradient-to-br from-[#E2DFFF] to-[#E6E2FC] text-[#5D4CFE]">
              <Code2 className="h-[14px] w-[14px]" strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-medium uppercase leading-[18px] text-[#666666] dark:text-white/60">
              Python Programming
            </span>
          </div>
          <div className="flex h-[18px] items-center">
            <span className="w-[101px] shrink-0 text-xs font-medium leading-[18px]">
              {progress}/{LESSONS_PER_MODULE} completed
            </span>
            <RiveProgressBar value={percent} className="w-32 shrink-0" />
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/python-logo.png"
          alt=""
          draggable={false}
          className="ml-auto h-[64px] w-[72px] max-w-none select-none object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

