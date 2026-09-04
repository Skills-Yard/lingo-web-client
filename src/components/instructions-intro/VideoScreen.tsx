import { ChevronRight, List, Network, Sparkles } from "lucide-react";
import type { VideoSlide } from "@/lib/constants/instructionsIntro";

export function VideoScreen({ slide }: { slide: VideoSlide }) {
  return (
    <div className="flex flex-col gap-5 min-[996px]:grid min-[996px]:grid-cols-5 min-[996px]:gap-x-8 min-[996px]:items-center min-[996px]:min-h-full min-[996px]:content-center">
      <div className="flex flex-col gap-4 min-[996px]:col-span-1 min-[996px]:col-start-1 min-[996px]:row-start-1">
        <h1 className="text-2xl min-[996px]:text-3xl font-semibold tracking-tight leading-tight text-center min-[996px]:text-left">
          <span className="text-primary">{slide.highlightWord}</span>{" "}
          <span className="text-foreground">{slide.title}</span>
        </h1>
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

      <div className="relative w-full aspect-video max-h-100 min-[996px]:aspect-auto min-[996px]:max-h-none min-[996px]:h-105 overflow-hidden rounded-[8px] bg-[#1A1C22] shadow-lg min-[996px]:col-span-3 min-[996px]:col-start-2 min-[996px]:row-start-1">
        <video
          src="/vedio/lumi.mp4"
          controls
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="w-full rounded-[8px] p-4 mt-4 min-[996px]:mt-0 flex items-center gap-3 min-[996px]:col-span-1 min-[996px]:col-start-5 min-[996px]:row-start-1 min-[996px]:self-stretch min-[996px]:flex-col min-[996px]:items-start min-[996px]:justify-center min-[996px]:text-left [background:linear-gradient(180deg,#EFF4F1_1.3%,rgba(1,161,127,0.12)_67.42%)] dark:[background:linear-gradient(180deg,rgba(255,255,255,0)_1.3%,rgba(1,161,127,0.12)_67.42%)]">
        <Sparkles className="w-6 h-6 text-primary shrink-0" />
        <p className="text-xs min-[996px]:text-sm text-secondary-foreground font-medium leading-snug">
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
