"use client";

import { SlotImage } from "@/components/level-two/SlotImage";
import { tintClass } from "../tokens";
import type { Tint } from "../types";

export type LessonCard = {
  id: string;
  title: string;
  /** A line under the title. */
  line?: string;
  /** A picture: a file in `public/images/level-two/`, or a path that starts with "/". */
  image?: string;
  /** A big number or word over the title ("₹500", "12"). */
  value?: string;
  tint?: Tint | (string & {});
};

export type LessonCardsProps = {
  cards: readonly LessonCard[];
  /** `row`: all in one row. `grid`: two across, as many rows as needed. */
  layout?: "row" | "grid";
  className?: string;
};

/**
 * Cards or tiles of facts and numbers: a picture or a big value, a title and a line. (Kept for now as the one
 * place such cards are drawn; the pieces that draw their own cards will be merged into it.)
 */
export function LessonCards({ cards, layout = "row", className = "" }: LessonCardsProps) {
  return (
    <div className={`w-full gap-2.5 ${layout === "grid" ? "grid grid-cols-2" : "flex items-stretch"} ${className}`}>
      {cards.map((card) => (
        <div key={card.id} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[8px] border-4 border-white px-1.5 py-2 text-center shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent ${tintClass(card.tint)}`}>
          {card.image && (
            <span className="flex h-[46px] w-full items-center justify-center">
              <SlotImage file={card.image} className="max-h-full max-w-full object-contain" />
            </span>
          )}
          {card.value && <span className="text-[22px] leading-7 font-bold text-[#444444] dark:text-white">{card.value}</span>}
          <span className="text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{card.title}</span>
          {card.line && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{card.line}</span>}
        </div>
      ))}
    </div>
  );
}
