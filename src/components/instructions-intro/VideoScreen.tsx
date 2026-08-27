import Image from "next/image";
import { List, Maximize2, Network, Play, Sparkles } from "lucide-react";
import type { VideoSlide } from "@/lib/constants/instructionsIntro";

/** "What are Instructions?" — video thumbnail with a play badge and the takeaway caption. */
export function VideoScreen({ slide }: { slide: VideoSlide }) {
  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-5 md:gap-x-8 md:items-center md:min-h-full md:content-center">
      <div className="flex flex-col gap-4 md:col-span-1 md:col-start-1 md:row-start-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-center md:text-left flex flex-wrap items-center gap-2 justify-center md:justify-start">
          {/* <Network className="w-5 h-5 text-primary shrink-0 md:hidden" /> */}
          <span className="text-primary">{slide.highlightWord}</span>
          <span className="text-primary md:text-foreground">{slide.title}</span>
        </h1>
        <div className="hidden md:flex flex-col gap-3 text-[#6456BD]">
          <Network className="w-10 h-10" />
          <List className="w-8 h-8" />
        </div>
      </div>

      <div className="relative w-full h-[400px] md:h-105 rounded-[8px] bg-[#1A1C22] flex items-center justify-center overflow-hidden shadow-lg md:col-span-3 md:col-start-2 md:row-start-1">
        <Image
          src="/images/vedioImg.png"
          height={700}
          width={512}
          alt="What are Instructions? video thumbnail"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
          <Play className="w-6 h-6 text-primary fill-primary ml-0.5" />
        </div>

        <div className="absolute bottom-0 inset-x-0 h-9 px-3 flex items-center gap-2.5 bg-black/70 backdrop-blur-[2px]">
          <Play className="w-3 h-3 text-white fill-white shrink-0" />
          <span className="text-[10px] text-white shrink-0">01:02</span>
          <div className="relative grow h-0.5 rounded-full bg-white/40">
            <span className="absolute left-[22%] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
          </div>
          <span className="text-[10px] text-white shrink-0">05:45</span>
          <Maximize2 className="w-3.5 h-3.5 text-white shrink-0" />
        </div>
      </div>

      <div className="w-full rounded-[8px] p-4 mt-4 md:mt-0 flex items-center gap-3 md:col-span-1 md:col-start-5 md:row-start-1 md:self-stretch md:flex-col md:items-start md:justify-center md:text-left [background:linear-gradient(180deg,#EFF4F1_1.3%,rgba(1,161,127,0.12)_67.42%)] dark:[background:linear-gradient(180deg,rgba(255,255,255,0)_1.3%,rgba(1,161,127,0.12)_67.42%)]">
        <Sparkles className="w-6 h-6 text-primary shrink-0" />
        <p className="text-xs md:text-sm text-secondary-foreground font-medium leading-snug">
          {slide.caption}
        </p>
      </div>
    </div>
  );
}
