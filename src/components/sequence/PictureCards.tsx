import { SlotImage } from "@/components/level-two/SlotImage";
import { COLUMN_W } from "@/lib/questionColumn";
import type { PictureCard } from "./sequence";

/** The flat look's cards (Figma `sequence_8`): two 166 x 187 cards 19 apart, their art (at most 83 x 56) in a 90 x 90 box. */
export const FLAT_CARDS = { width: 351, height: 187 } as const;

/**
 * Two pictures side by side that aren't answers, so they take no taps. `flat` draws them as the 3D flow's
 * design has them: 166 x 187 with a small icon over the words and a soft shadow (`height` is then `FLAT_CARDS.height`).
 */
export function PictureCards({ cards, height, flat = false }: { cards: readonly [PictureCard, PictureCard]; height: number; flat?: boolean }) {
  if (flat) {
    return (
      <div className="flex gap-[19px]" style={{ width: FLAT_CARDS.width, height }}>
        {cards.map((card) => (
          <div
            key={card.text}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-3.5 rounded-[8px] border-4 border-white px-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.1)] dark:border-[#818185] ${card.tint}`}
          >
            <span className="flex size-[90px] shrink-0 items-center justify-center">
              <SlotImage file={card.icon} className="h-[56px] w-[83px] object-contain" />
            </span>
            <span className="text-center text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">{card.text}</span>
          </div>
        ))}
      </div>
    );
  }
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
