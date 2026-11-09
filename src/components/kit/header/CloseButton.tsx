"use client";

import { feelTap } from "../feel";

/** The header's cross: a 30px square with a round-capped X. */
export function CloseButton({ onClick, label = "Close", className = "" }: { onClick?: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        feelTap();
        onClick?.();
      }}
      className={`pointer-events-auto flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#444444] transition-transform active:scale-95 dark:text-white/70 ${className}`}
    >
      <svg aria-hidden viewBox="0 0 30 30" className="size-[30px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        <path d="M6.85 6.85 23.15 23.15M23.15 6.85 6.85 23.15" />
      </svg>
    </button>
  );
}
