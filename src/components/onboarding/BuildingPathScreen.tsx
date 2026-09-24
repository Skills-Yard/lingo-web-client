"use client";

import Image from "next/image";
import { DialogueBubble } from "@/components/ui/DialogueBubble";

export function BuildingPathScreen({ onNext, onBack, careerTitle = "Software Engineer" }: { onNext?: () => void; onBack?: () => void; careerTitle?: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0D1016] text-[#2C2C2C] dark:text-white font-sans max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 mb-6 shrink-0">
        <button onClick={onBack} className="p-2 text-gray-500 hover:text-black dark:hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        {/* No progress bar on this screen based on screenshot */}
        <div className="w-10"></div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 px-4 pb-6">
        <h1 className="text-2xl font-bold text-center flex items-center gap-2">
          Building Career Path...
          {/* Sparkles icon placeholder */}
          <span className="text-[#01A17F] text-3xl">✧</span>
        </h1>

        {/* Large Fox Character */}
        <div className="relative w-48 h-48 animate-[bounce_3s_ease-in-out_infinite]">
          <Image src="/images/fox.png" alt="Fox mascot building path" fill className="object-contain" />
        </div>

        {/* Speech Bubble */}
        {/* pt-4 makes room for the tail, which overhangs the bubble's box. */}
        <div className="w-full max-w-xs mx-auto pt-4">
          <DialogueBubble
            tail="up"
            className="dark:[--bubble-fill:#15181E]"
            contentClassName="px-4 py-3 text-center"
          >
            <p className="font-medium text-[15px] leading-relaxed">
              Good news: your <span className="font-bold">[{careerTitle}]</span> journey runs on <span className="text-[#01A17F] font-bold">Python</span>. One of the most in-demand languages.
            </p>
          </DialogueBubble>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 shrink-0 p-4 bg-white dark:bg-[#0D1016] border-t border-gray-100 dark:border-gray-800 z-50">
        <button 
          onClick={onNext}
          className="w-full py-4 rounded-xl font-bold text-white bg-[#01A17F] hover:bg-[#018e70] transition-all flex items-center justify-center overflow-hidden relative active:scale-[0.98]"
        >
          {/* Subtle stripe effect */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_25%,rgba(255,255,255,0.3)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.3)_75%,rgba(255,255,255,0.3)_100%)] bg-[length:20px_20px]"></div>
          <span className="relative z-10">Yes!</span>
        </button>
      </div>
    </div>
  );
}
