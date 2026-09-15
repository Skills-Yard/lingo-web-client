import Image from "next/image";
import type { ExamplesGridSlide } from "@/lib/constants/instructionsIntro";
import { RobuSays } from "./RobuSays";

export function ExamplesGridScreen({
  slide,
  instantSpeech,
  registerAnchor,
}: {
  slide: ExamplesGridSlide;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10 md:min-h-full">
      <RobuSays
        text={slide.title}
        instant={instantSpeech}
        // No fixed `md:w-56` here any more: Robu's own anchor is already
        // ROBU_DEFAULT_SIZE's fixed 336px at `md`, wider than that column
        // ever was, so the column never actually constrained him — it only
        // clipped how much room his heading had, shoving it under the tile
        // grid (or, once the heading was pulled closer to Robu for the gap
        // fix, under Robu himself). `md:w-auto` overrides RobuSays' own
        // base `w-full` so this row sizes to its content (Robu + heading)
        // instead of claiming the whole flex row and squeezing the grid
        // sibling down to nothing.
        className="md:w-auto md:max-w-105 md:shrink-0"
        registerAnchor={registerAnchor}
      />

      <div className="flex flex-col gap-5 justify-center grow md:flex-row md:flex-wrap md:justify-center md:gap-x-4 lg:gap-x-6">
        {slide.pairs.map((pair) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-4 md:gap-3 lg:gap-4"
          >
            <ExampleTile image={pair.leftImage} label={pair.leftLabel} />

            <Image
              src="/images/arrowLines.png"
              alt=""
              width={24}
              height={16}
              className="object-contain shrink-0"
            />

            <ExampleTile image={pair.rightImage} label={pair.rightLabel} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleTile({ image, label }: { image: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-[30vw] max-w-30 min-w-20 md:w-28 lg:w-32 md:max-w-none">
      <div className="relative w-full aspect-5/6 md:w-28 md:h-28 lg:w-32 lg:h-32 md:aspect-auto rounded-[18px] bg-[#EFF4F1] dark:bg-[#15181E] overflow-hidden flex items-center justify-center p-2">
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
