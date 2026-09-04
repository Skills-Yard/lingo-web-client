import Image from "next/image";
import type { ExamplesGridSlide } from "@/lib/constants/instructionsIntro";

export function ExamplesGridScreen({ slide }: { slide: ExamplesGridSlide }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10 md:min-h-full">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-center md:text-left text-foreground md:w-56 md:shrink-0">
        {slide.title}
      </h1>

      <div className="flex flex-col gap-5 justify-center grow md:flex-row md:flex-wrap md:justify-center md:gap-x-4">
        {slide.pairs.map((pair) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-4 md:gap-3"
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
    <div className="flex flex-col items-center gap-1.5 w-[30vw] max-w-30 min-w-20 md:w-28 md:max-w-none">
      <div className="relative w-full aspect-5/6 md:w-28 md:h-28 md:aspect-auto rounded-[18px] bg-[#EFF4F1] dark:bg-[#15181E] overflow-hidden flex items-center justify-center p-2">
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
