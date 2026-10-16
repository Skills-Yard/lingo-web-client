"use client";

import { motion } from "framer-motion";

const POPUP_W = 210;
/** How far below the platform's top-face centre the popup's top edge sits —
 * under the slab, so it reads as hanging from the bottom of the platform. */
const BELOW_PLATFORM = 62;
const STAGE_MARGIN = 10;

type LevelStartPopupProps = {
  /** Top-face centre of the platform it belongs to, in world px. */
  cx: number;
  cy: number;
  stageWidth: number;
  title: string;
  xp: number;
  onStart: () => void;
  /** Seconds to wait before appearing (Hex is still hopping onto the platform). */
  delay?: number;
};

/**
 * The mini popup under the live platform: the lesson's title and a purple
 * Start button with the XP it earns. It stays inside the stage, and its
 * pointer keeps aiming at the platform even when the popup has to shift.
 */
export function LevelStartPopup({ cx, cy, stageWidth, title, xp, onStart, delay = 0 }: LevelStartPopupProps) {
  const left = Math.min(
    Math.max(cx - POPUP_W / 2, STAGE_MARGIN),
    stageWidth - STAGE_MARGIN - POPUP_W,
  );
  const pointerX = cx - left;

  return (
    <motion.div
      data-level-popup
      role="dialog"
      aria-label={title}
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 420, damping: 30, delay },
      }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="absolute z-20 rounded-xl bg-white px-4 pt-3.5 pb-4 text-center shadow-[0_6px_24px_rgba(0,0,0,0.18)] dark:bg-[#1c2e36]"
      style={{ left, top: cy + BELOW_PLATFORM, width: POPUP_W, transformOrigin: `${pointerX}px 0` }}
    >
      <span
        aria-hidden
        className="absolute -top-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-white dark:bg-[#1c2e36]"
        style={{ left: pointerX - 6 }}
      />
      <p className="text-[15px] leading-[1.3] font-medium text-[#2C2C2C] dark:text-white">{title}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#5D4CFE] text-[16px] font-medium text-white transition-transform active:scale-95"
      >
        Start
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px] leading-none font-semibold">
          +{xp} XP
        </span>
      </button>
    </motion.div>
  );
}
