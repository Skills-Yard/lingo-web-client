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
        side="right"
        sideLg="above"
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
    <div className="flex w-[25vw] min-w-16 max-w-20 flex-col items-center gap-1 md:w-20 md:max-w-none">
      <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[#EFF4F1] p-1.5 dark:bg-[#15181E] md:h-20 md:w-20">
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
