import { ChevronRight, List, Network, Sparkles } from "lucide-react";
import type { VideoSlide } from "@/lib/constants/instructionsIntro";
import { RobuSays } from "./RobuSays";

export function VideoScreen({
  slide,
  instantSpeech,
  registerAnchor,
}: {
  slide: VideoSlide;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}) {
  return (
    // `gap-3` (was `gap-5`) + `min-[996px]:gap-y-0`: `gap-5` also set the grid's
    // *row* gap (only `gap-x-8` was overridden there), so Robu's row always sat
    // 20px above the video row on top of his own box's empty space. Now the
    // only space between them is that box itself — which the smaller Robu
    // below shrinks too.
    <div className="flex flex-col gap-3 min-[996px]:grid min-[996px]:grid-cols-5 min-[996px]:gap-x-8 min-[996px]:gap-y-0 min-[996px]:items-center min-[996px]:min-h-full min-[996px]:content-center">
      <div className="min-[996px]:col-span-5 min-[996px]:col-start-1 min-[996px]:row-start-1">
        <RobuSays
          text={`${slide.highlightWord} ${slide.title}`}
          highlight={slide.highlightWord}
          instant={instantSpeech}
          side="left"
          // Smaller than `ROBU_DEFAULT_SIZE` so Robu doesn't crowd out the
          // video below, and so the empty strip inside his box between him
          // and the video stays thin. This is *off* the w-32/sm:w-60/md:w-84
          // track `ROBU_TRAILING_GAP_PULL` is calibrated to, so the pull is
          // re-scaled to the same ~22-25% of the box at each step (see the
          // `className` below) — otherwise the heading would slide under him.
          robuClassName="h-32 w-32 md:h-40 md:w-40 min-[996px]:h-56 min-[996px]:w-56"
          registerAnchor={registerAnchor}
          audioSrc="/audios/screen_6_audio.mpeg"
          // `min-[996px]:justify-center!`: only from the point this row
          // actually spans the full 5-col grid width, centering it against
          // the video below — mobile/md keep RobuSays' own default
          // `justify-start` (left-aligned), unchanged from before. The `!`
          // forces this one call site's override to actually stick past
          // that default instead of silently losing to it regardless of
          // class order. `gap-4` scoped the same way — unprefixed, it was
          // fighting RobuSays' own base `gap-2` for mobile/md too, widening
          // spacing there that main never had.
          //
          // The three `[&>div:nth-child(2)]:-ml-*` re-scale the heading's pull
          // to Robu's box at each size (128 -> -ml-7, 160 -> -ml-10, 224 ->
          // -ml-14). The unprefixed one also covers `sm:` (Robu stays 128
          // there), beating RobuSays' own `sm:-ml-15`/`md:-ml-21` by specificity.
          className="min-[996px]:justify-center! min-[996px]:gap-4 [&>div:nth-child(2)]:-ml-7 md:[&>div:nth-child(2)]:-ml-10 min-[996px]:[&>div:nth-child(2)]:-ml-14"
        />
      </div>

      <div className="flex flex-col gap-4 min-[996px]:col-span-1 min-[996px]:col-start-1 min-[996px]:row-start-2">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center gap-3 rounded-[12px] border border-primary/60 px-3.5 py-3 text-left transition-all active:scale-[0.99] [background:linear-gradient(180deg,#FFFFFF_1.3%,#EEFAF6_67.42%)] dark:[background:linear-gradient(180deg,#15181E_1.3%,#0F2921_67.42%)]"
          >
            <Network className="h-6 w-6 shrink-0 text-[#6456BD]" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-primary">Overview</span>
              <span className="text-xs text-secondary-foreground">Understand the basics</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-[12px] border border-black/6 bg-white px-3.5 py-3 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-all active:scale-[0.99] hover:border-primary/40 dark:border-white/8 dark:bg-[#15181E]"
          >
            <List className="h-6 w-6 shrink-0 text-[#6456BD]" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">Key Points</span>
              <span className="text-xs text-secondary-foreground">Important takeaways</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-video max-h-100 min-[996px]:aspect-auto min-[996px]:max-h-none min-[996px]:h-105 overflow-hidden rounded-[8px] bg-[#1A1C22] shadow-lg min-[996px]:col-span-3 min-[996px]:col-start-2 min-[996px]:row-start-2">
        <video
          src="/vedio/lumi.mp4"
          controls
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="w-full rounded-[8px] p-4 mt-4 min-[996px]:mt-0 flex items-center gap-3 min-[996px]:col-span-1 min-[996px]:col-start-5 min-[996px]:row-start-2 min-[996px]:self-stretch min-[996px]:flex-col min-[996px]:items-start min-[996px]:justify-center min-[996px]:text-left [background:linear-gradient(180deg,#EFF4F1_1.3%,rgba(1,161,127,0.12)_67.42%)] dark:[background:linear-gradient(180deg,rgba(255,255,255,0)_1.3%,rgba(1,161,127,0.12)_67.42%)]">
        <Sparkles className="w-6 h-6 text-primary shrink-0" />
        <p className="text-xs min-[996px]:text-sm text-secondary-foreground font-medium leading-snug">
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
