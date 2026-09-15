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
        stacked
        // This row is capped to `md:w-56` (224px) once it's beside the image
        // grid, and that column width doesn't grow again past `md:` — so
        // however big Robu gets has to stay under that at every breakpoint
        // from `md:` up, not just below `sm:`. Safe to sit fairly close to
        // that ceiling since `stacked` puts the bubble on its own line above
        // him at every width, rather than beside him.
        robuClassName="h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 lg:h-52 lg:w-52"
        className="md:w-56 md:shrink-0"
        registerAnchor={registerAnchor}
      />

      <div className="flex flex-col gap-5 md:gap-4 justify-center grow">
        {slide.pairs.map((pair) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-4 md:gap-2"
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
    <div className="flex flex-col items-center gap-1.5 md:gap-1 w-[30vw] max-w-30 min-w-20 md:w-24 md:max-w-none">
      <div className="relative w-full aspect-5/6 rounded-[18px] md:rounded-[14px] bg-[#EFF4F1] dark:bg-[#15181E] overflow-hidden flex items-center justify-center p-2 md:p-1.5">
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
