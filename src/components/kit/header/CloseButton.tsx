"use client";

import { EDGE, RAISED_SMALL } from "@/components/ui/raised";

/** The close button's face: a raised 30px square (white, on a khaki edge) with the cross inside. */
const FACE = `pointer-events-auto flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-white text-[#444444] dark:bg-[#15181E] dark:text-white/70 ${RAISED_SMALL} ${EDGE.khaki}`;

/** The header's cross: a raised 30px button with a round-capped X. */
export function CloseButton({ onClick, label = "Close", className = "" }: { onClick?: () => void; label?: string; className?: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${FACE} ${className}`}>
      {/* The cross is 19.3px across with a 3px stroke, in the 30 x 30 box. */}
      <svg aria-hidden viewBox="0 0 30 30" className="size-[30px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        <path d="M6.85 6.85 23.15 23.15M23.15 6.85 6.85 23.15" />
      </svg>
    </button>
  );
}
