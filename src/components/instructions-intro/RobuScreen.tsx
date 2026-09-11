import type { RobuSlide } from "@/lib/constants/instructionsIntro";
import { RobuEyeBlink } from "./RobuEyeBlink";

export function RobuScreen({ slide }: { slide: RobuSlide }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center md:grid md:grid-cols-2 md:items-center md:gap-x-12 md:text-left md:min-h-full">
      {/* ── Copy — stacked above the mascot on mobile, left column on laptop ── */}
      <div className="flex flex-col items-center gap-3 md:order-1 md:items-start md:gap-5">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          <span className="text-primary">{slide.highlightWord}</span> {slide.title}
        </h1>
        {slide.description && (
          <p className="max-w-sm text-sm md:text-base font-medium leading-[1.5] text-[#666666] dark:text-neutral-400">
            {slide.description}
          </p>
        )}
      </div>

      {/* ── Blinking Robu — scales with the viewport, never overflows ── */}
      <div className="flex w-full items-center justify-center md:order-2">
        <RobuEyeBlink className="h-[clamp(180px,40vw,320px)] w-[clamp(180px,40vw,320px)]" />
      </div>
    </div>
  );
}
