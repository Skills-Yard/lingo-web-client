"use client";

import { motion } from "framer-motion";

const POPUP_W = 186;
const STAGE_MARGIN = 4;

type LevelStartPopupProps = {
  /** Target anchor X where the pointer tip should point (in stage px) */
  cx: number;
  /** Target anchor Y where the pointer tip should point (in stage px) */
  cy: number;
  stageWidth: number;
  title: string;
  xp: number;
  onStart: () => void;
  onClose?: () => void;
  delay?: number;
  /** Distance from anchor to popup edge (defaults to 8px) */
  offset?: number;
  /** Whether the popup appears below (default) or above the anchor */
  placement?: "bottom" | "top";
};

/**
 * Precision level start popup: speech bubble anchored directly to the clicked platform.
 * Pointer arrow precisely touches (cx, cy).
 */
export function LevelStartPopup({
  cx,
  cy,
  stageWidth = 390,
  title,
  xp,
  onStart,
  onClose,
  delay = 0,
  offset = 4,
  placement = "bottom",
}: LevelStartPopupProps) {
  // Constrain popup horizontally within stage margins
  const left = Math.min(
    Math.max(cx - POPUP_W / 2, STAGE_MARGIN),
    stageWidth - STAGE_MARGIN - POPUP_W,
  );
  // Pointer arrow position along popup's top/bottom edge
  const pointerX = Math.min(Math.max(cx - left, 18), POPUP_W - 18);

  const isTop = placement === "top";
  // If placement is bottom, popup sits below cy:
  const top = isTop ? cy - 124 - offset : cy + offset;

  return (
    <>
      {/* Invisible backdrop to dismiss popup when tapping anywhere outside */}
      <div
        className="fixed -inset-[200vmax] z-[55]"
        onClick={onClose}
        aria-hidden
      />

      {/* The Popover Card */}
      <motion.div
        data-level-popup
        role="dialog"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.88, y: isTop ? 6 : -6 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: "spring", stiffness: 420, damping: 28, delay },
        }}
        exit={{ opacity: 0, scale: 0.9, y: isTop ? 4 : -4 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className="absolute z-[60] rounded-2xl bg-white px-4 pt-3.5 pb-4 text-center shadow-[0_8px_30px_rgba(0,0,0,0.18)] dark:bg-[#1E293B] border border-black/5 dark:border-white/10"
        style={{
          left,
          top,
          width: POPUP_W,
          transformOrigin: `${pointerX}px ${isTop ? "100%" : "0%"}`,
        }}
      >
        {/* Pointer Arrow pointing to the platform */}
        {isTop ? (
          <span
            aria-hidden
            className="absolute -bottom-1.5 h-3.5 w-3.5 rounded-[2px] bg-white border-r border-b border-black/5 dark:bg-[#1E293B] dark:border-white/10"
            style={{ left: `${pointerX}px`, transform: "translateX(-50%) rotate(45deg)" }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute -top-1.5 h-3.5 w-3.5 rounded-[2px] bg-white border-l border-t border-black/5 dark:bg-[#1E293B] dark:border-white/10"
            style={{ left: `${pointerX}px`, transform: "translateX(-50%) rotate(45deg)" }}
          />
        )}

        <p className="text-[14px] leading-[1.3] font-semibold text-[#1E293B] dark:text-white px-1">
          {title}
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#5D4CFE] text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(93,76,254,0.35)] transition-transform hover:bg-[#5240FB] active:scale-95"
        >
          Start
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] leading-none font-bold">
            +{xp} XP
          </span>
        </button>
      </motion.div>
    </>
  );
}
