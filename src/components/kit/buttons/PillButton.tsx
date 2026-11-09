"use client";

import type { ReactNode } from "react";
import { feelTap } from "../feel";

export type PillButtonProps = {
  label: string;
  onClick: () => void;
  /** `solid`: teal with a darker edge (a main small action). `outline`: white with teal words (a quiet one, like Replay). */
  look?: "solid" | "outline";
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** A small round-ended button for the actions inside a screen: Run, Replay, Reset, Check. */
export function PillButton({ label, onClick, look = "solid", icon, disabled = false, className = "" }: PillButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        feelTap();
        onClick();
      }}
      className={`pointer-events-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-[16px] leading-6 font-bold transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 enabled:active:scale-95 ${
        look === "solid"
          ? "bg-[#08A4AD] px-6 py-2 text-white shadow-[0_3px_0_#067F86] enabled:active:translate-y-px enabled:active:shadow-[0_2px_0_#067F86]"
          : "border border-[#E7ECEF] bg-white px-4 py-2 text-[14px] font-semibold text-[#08A4AD] shadow-[0_2px_10px_rgba(31,42,68,0.08)] dark:border-white/10 dark:bg-[#15181E]"
      } ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
