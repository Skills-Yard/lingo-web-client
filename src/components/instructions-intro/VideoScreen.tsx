import { ChevronRight, List, Network, Sparkles } from "lucide-react";
import type { VideoSlide } from "@/lib/constants/instructionsIntro";
import { RobuAnchor } from "./RobuAnchor";
import { SpeechBubble } from "./SpeechBubble";

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
      // short-enough viewport this grid's rows (Robu + the 420px-tall video)
      // can end up taller than the space available for them. Plain `center`
      // splits that overflow evenly above *and* below — and the half above
      // is genuinely unreachable by scrolling (browsers don't let you scroll
      // "past" a centered block's start edge), which is exactly what was
      // hiding Robu behind the header. `safe center` still centers when
      // everything fits, but falls back to top alignment the moment it
      // doesn't, so any overflow lands at the bottom where scrolling can
      // actually reach it instead.
      className="flex flex-col gap-4 sm:gap-5 min-[996px]:grid min-[996px]:grid-cols-5 min-[996px]:gap-x-8 min-[996px]:items-center min-[996px]:min-h-full min-[996px]:content-center-safe"
    >
      {/* Robu + his "What are Instructions?" bubble — one paired unit at
          every width, not split into two independent grid items at `996px`+
          (as this used to be): Robu now sits wherever centering the *pair*
          together lands him, matching the bubble he's centered over the
          video below instead of being pinned to column 1's own position
          (where the Overview/Key Points card also sits — the two are no
          longer guaranteed to line up, a deliberate tradeoff for this). */}
      <div className="flex flex-row items-start gap-2 sm:gap-3 min-[996px]:col-start-2 min-[996px]:col-span-3 min-[996px]:row-start-1 min-[996px]:items-center min-[996px]:justify-center min-[996px]:gap-5">
        <RobuAnchor
          registerAnchor={registerAnchor}
          // Column 1 of the 5-col grid is only ~160px wide at `lg:` and
          // ~212px at `xl:` (the whole grid caps at the shared 1280px
          // container) — sizes bigger than that overflow into the bubble's
          // own column next to it, so growth at `lg:`/`xl:` has to stay
          // under those, not just "bigger than before". Stays small (same
          // as below `996px`) through the 996-1023px sliver too, so there's
          // real room left to grow into once `lg:` actually arrives.
          className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 lg:h-36 lg:w-36 xl:h-44 xl:w-44"
        />
        <div className="min-w-0 flex-1 min-[996px]:flex-none">
          <SpeechBubble
            text={`${slide.highlightWord} ${slide.title}`}
            highlight={slide.highlightWord}
            instant={instantSpeech}
            size="lg"
            tailCorner="bottom-left"
            bubbleClassName="sm:max-w-md"
          />
        </div>
      </div>

      <div
        // `min-[996px]:self-start`: row 2's height is driven by the video
        // beside it (420px tall), and the grid's own `items-center` was
        // centering this block *within* that tall row — pulling it well
        // below Robu (bottom of the short row 1) instead of sitting right
        // under him. Aligning to the row's own top keeps it directly under
        // Robu regardless of how tall the video makes that row.
        className="flex flex-col gap-2 sm:gap-3 w-full min-[996px]:col-start-1 min-[996px]:row-start-2 min-[996px]:self-start"
      >
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

      <div className="relative w-full aspect-video max-h-[280px] sm:max-h-none min-[996px]:aspect-auto min-[996px]:max-h-none min-[996px]:h-105 overflow-hidden rounded-[8px] bg-[#1A1C22] shadow-lg min-[996px]:col-span-3 min-[996px]:col-start-2 min-[996px]:row-start-2">
        <video
          src="/vedio/lumi.mp4"
          controls
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div
        // `row-start-2` (not `row-span-2 row-start-1`): spanning both rows
        // made this taller than the video beside it — it picked up row 1's
        // height too (Robu + the bubble above), even though it only ever
        // sits next to the video. Placed in just row 2 with `self-stretch`,
        // it now matches the video's own height exactly instead of running
        // taller than it (or needing to scroll its own overflowing text).
        className="w-full rounded-[8px] p-3 sm:p-4 flex items-center gap-3 min-[996px]:mt-0 min-[996px]:col-span-1 min-[996px]:col-start-5 min-[996px]:row-start-2 min-[996px]:self-stretch min-[996px]:flex-col min-[996px]:items-start min-[996px]:justify-center min-[996px]:text-left [background:linear-gradient(180deg,#EFF4F1_1.3%,rgba(1,161,127,0.12)_67.42%)] dark:[background:linear-gradient(180deg,rgba(255,255,255,0)_1.3%,rgba(1,161,127,0.12)_67.42%)]"
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
        <p className="text-xs min-[996px]:text-sm text-secondary-foreground font-medium leading-snug">
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
