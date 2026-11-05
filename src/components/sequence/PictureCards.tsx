import { SlotImage } from "@/components/level-two/SlotImage";
import { COLUMN_W } from "@/lib/questionColumn";
import type { PictureCard } from "./sequence";

/** Two pictures side by side that aren't answers, so they take no taps. */
export function PictureCards({ cards, height }: { cards: readonly [PictureCard, PictureCard]; height: number }) {
  return (
    <div className="flex gap-3.5" style={{ width: COLUMN_W, height }}>
      {cards.map((card) => (
        <div
          key={card.text}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-[8px] border-4 border-white px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-[#818185] ${card.tint}`}
        >
          <span className="flex min-h-0 w-full flex-1 items-center justify-center pt-2">
            <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
          </span>
          <span className="pb-2 text-center text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">{card.text}</span>
        </div>
      ))}
    </div>
  );
}
