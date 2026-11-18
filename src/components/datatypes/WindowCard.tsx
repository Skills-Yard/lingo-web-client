import type { ReactNode } from "react";

/** A row on the window's panel: a pale blue strip (give it its own height and padding). */
export const WINDOW_ROW = "rounded-[8px] bg-linear-to-r from-[#E2F1F9] to-[#DCEDF9] dark:from-[#1C2A3A] dark:to-[#1A2633]";

/** What the panel's rows are spaced by and padded with, unless the window says otherwise. */
const PANEL = "gap-[9px] pt-4 pr-[21px] pb-5 pl-[21px]";

/** Three people, solid, for a title bar. */
export function People() {
  return (
    <svg aria-hidden viewBox="0 0 28 22" className="h-[22px] w-7 shrink-0 fill-current">
      <circle cx="14" cy="6" r="4.3" />
      <path d="M6.2 21.5c0-4.6 3.5-7.6 7.8-7.6s7.8 3 7.8 7.6z" />
      <circle cx="4.8" cy="8.4" r="3" />
      <path d="M0 20c0-3.2 2.1-5.3 4.8-5.3.9 0 1.7.2 2.4.6-1.7 1.4-2.8 3.1-3.1 4.7z" />
      <circle cx="23.2" cy="8.4" r="3" />
      <path d="M28 20c0-3.2-2.1-5.3-4.8-5.3-.9 0-1.7.2-2.4.6 1.7 1.4 2.8 3.1 3.1 4.7z" />
    </svg>
  );
}

/**
 * The module's information card, as screen 10's "Registered Students" is drawn: a
 * soft teal frame, a teal title bar (an icon, the title and three dots) over a
 * pale panel of rows. `icon` is drawn in white in a 28 x 22 box (give a lucide icon
 * `size-6`); `panel` replaces the spacing of the rows (its default suits a few rows of 33px).
 */
export function WindowCard({ title, icon, panel = PANEL, children }: { title: string; icon: ReactNode; panel?: string; children: ReactNode }) {
  return (
    <div className="w-[340px] rounded-[30px] bg-linear-to-b from-[#5CC9CC] to-[#8FDDE3] px-3 pt-2.5 pb-3 shadow-[0_6px_16px_rgba(8,152,149,0.22)] dark:from-[#0F5F63] dark:to-[#157C80] dark:shadow-none">
      <div className="flex h-[42px] items-center gap-3 rounded-t-[18px] bg-linear-to-b from-[#0DA09C] to-[#03888B] px-4 text-white">
        <span aria-hidden className="flex h-[22px] w-7 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="text-[16px] leading-6 font-semibold">{title}</span>
        <span aria-hidden className="ml-auto flex gap-[9px]">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-2.5 rounded-full bg-white/60" />
          ))}
        </span>
      </div>
      <div className={`flex flex-col rounded-b-[18px] bg-[#F5FAFE] dark:bg-[#15181E] ${panel}`}>{children}</div>
    </div>
  );
}
