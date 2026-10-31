"use client";

import { HEADING } from "./homeFonts";

/** A pill button with a gloss strip across its top, and a white disc holding
 * a green play triangle. */
export function GlossButton({
  label,
  background,
  width,
  onClick,
}: {
  label: string;
  /** The pill's colour. */
  background: string;
  /** Width in px: the pill is as wide as its label needs. */
  width: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative isolate flex h-[43.5px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 shadow-[0_3px_8px_rgba(11,26,36,0.14)] transition-transform active:scale-95"
      style={{ width, backgroundColor: background }}
    >
      <span aria-hidden className="absolute inset-x-[3px] top-[3px] h-[17px] rounded-2xl bg-white opacity-[0.18]" />
      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/feed/play.png" alt="" draggable={false} className="ml-0.5 h-[14px] select-none" />
      </span>
      <span className={`relative z-10 whitespace-nowrap text-[15px] leading-[18px] text-white ${HEADING}`}>
        {label}
      </span>
    </button>
  );
}
