import type { RobuSlide } from "@/lib/constants/instructionsIntro";
import { RobuAnchor, ROBU_DEFAULT_SIZE } from "./RobuAnchor";

export function RobuScreen({
  slide,
  registerAnchor,
}: {
  slide: RobuSlide;
  /** Registers where Robu (a single persistent mascot — see RobuStage) should
   * stand for this closing screen. */
  registerAnchor: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center md:grid md:grid-cols-2 md:items-center-safe md:gap-x-12 md:text-left md:min-h-full">
      {/* ── Copy — stays first in the DOM (still stacked above the mascot on
          mobile, unchanged there), but `md:order-2` now puts it in the
          *right* column on desktop — Robu moves to the left column
          (`md:order-1` below) to match the one spot every other screen puts
          him in, instead of this screen's own reversed arrangement. ── */}
      <div className="flex flex-col items-center gap-3 md:order-2 md:items-start md:gap-5">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          <span className="text-primary">{slide.highlightWord}</span> {slide.title}
        </h1>
        {slide.description && (
          <p className="max-w-sm text-sm md:text-base font-medium leading-[1.5] text-[#666666] dark:text-neutral-400">
            {slide.description}
          </p>
        )}
      </div>

      {/* ── Blinking Robu — same size as every other screen's resting Robu
          (see ROBU_DEFAULT_SIZE) instead of its own bespoke clamp() ── */}
      <div className="flex w-full items-center justify-center md:order-1">
        <RobuAnchor registerAnchor={registerAnchor} className={ROBU_DEFAULT_SIZE} />
      </div>
    </div>
  );
}
