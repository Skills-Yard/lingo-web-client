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
    <div
      // `[align-content:safe_center]`, not plain `content-center`: on a
      // short-enough viewport this grid's row (Robu/buttons + the 420px-tall
      // video) can end up taller than the space available for it. Plain
      // `center` splits that overflow evenly above *and* below — and the
      // half above is genuinely unreachable by scrolling — so it falls back
      // to top alignment the moment it doesn't fit, landing any overflow at
      // the bottom where scrolling can actually reach it.
      className="flex flex-col gap-5 min-[996px]:grid min-[996px]:grid-cols-5 min-[996px]:gap-x-8 min-[996px]:items-center min-[996px]:min-h-full min-[996px]:content-center-safe"
    >
      <div className="flex flex-col gap-4 min-[996px]:col-span-1 min-[996px]:col-start-1 min-[996px]:row-start-1">
        <RobuSays
          text={`${slide.highlightWord} ${slide.title}`}
          highlight={slide.highlightWord}
          instant={instantSpeech}
          side="left"
          // Column 1 of the 5-col grid is only ~160px wide at `lg:` and
          // ~212px at `xl:` (the whole grid caps at the shared 1280px
          // container) and also carries the two cards below — sizes bigger
          // than the shared default (which reaches 336px by `md:`) overflow
          // that column, so Robu stays small here all the way up instead of
          // growing with the shared size everywhere else.
          robuClassName="h-20 w-20 sm:h-24 sm:w-24 min-[996px]:h-16 min-[996px]:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24"
          registerAnchor={registerAnchor}
        />
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center gap-3 rounded-[12px] border border-primary/60 px-3 sm:px-3.5 py-2.5 sm:py-3 text-left transition-all active:scale-[0.99] [background:linear-gradient(180deg,#FFFFFF_1.3%,#EEFAF6_67.42%)] dark:[background:linear-gradient(180deg,#15181E_1.3%,#0F2921_67.42%)]"
          >
            <Network className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#6456BD]" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-primary">Overview</span>
              <span className="text-xs text-secondary-foreground">Understand the basics</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-[12px] border border-black/6 bg-white px-3 sm:px-3.5 py-2.5 sm:py-3 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-all active:scale-[0.99] hover:border-primary/40 dark:border-white/8 dark:bg-[#15181E]"
          >
            <List className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#6456BD]" />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">Key Points</span>
              <span className="text-xs text-secondary-foreground">Important takeaways</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-video max-h-[280px] sm:max-h-none min-[996px]:aspect-auto min-[996px]:max-h-none min-[996px]:h-105 overflow-hidden rounded-[8px] bg-[#1A1C22] shadow-lg min-[996px]:col-span-3 min-[996px]:col-start-2 min-[996px]:row-start-1">
        <video
          src="/vedio/lumi.mp4"
          controls
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="w-full rounded-[8px] p-3 sm:p-4 mt-4 min-[996px]:mt-0 flex items-center gap-3 min-[996px]:col-span-1 min-[996px]:col-start-5 min-[996px]:row-start-1 min-[996px]:self-stretch min-[996px]:flex-col min-[996px]:items-start min-[996px]:justify-center min-[996px]:text-left [background:linear-gradient(180deg,#EFF4F1_1.3%,rgba(1,161,127,0.12)_67.42%)] dark:[background:linear-gradient(180deg,rgba(255,255,255,0)_1.3%,rgba(1,161,127,0.12)_67.42%)]">
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
        <p className="text-xs min-[996px]:text-sm text-secondary-foreground font-medium leading-snug">
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
