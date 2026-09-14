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
        side="left"
        sideLg="above"
        // This row is capped to `md:w-56` (224px) once it's beside the image
        // grid, and that column width doesn't grow again past `md:` — so
        // however big Robu gets has to stay under that at every breakpoint
        // from `md:` up, not just below `sm:`. Safe to sit fairly close to
        // that ceiling now that the bubble beside him (`flex-auto`, see
        // RobuSays) properly wraps to its own line below him instead of
        // overflowing when there isn't room left beside him.
        robuClassName="h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 lg:h-52 lg:w-52"
        className="md:w-56 md:shrink-0"
        registerAnchor={registerAnchor}
      />

      <div className="grid grow grid-cols-1 justify-center gap-4">
        {slide.pairs.map((pair) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-2 md:gap-2"
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
    <div className="flex w-[30vw] min-w-20 max-w-24 flex-col items-center gap-1 md:w-24 md:max-w-none">
      <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[#EFF4F1] p-1.5 dark:bg-[#15181E] md:h-24 md:w-24">
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
