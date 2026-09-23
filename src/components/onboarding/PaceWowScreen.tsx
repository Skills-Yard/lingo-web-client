"use client";

import Image from "next/image";

export function PaceWowScreen({ onNext, onBack, careerTitle = "Software Engineering" }: { onNext?: () => void; onBack?: () => void; careerTitle?: string }) {
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
        
        {/* Speech Bubble */}
        <div className="relative w-full max-w-xs mx-auto">
          {/* Tail of speech bubble (pointing down this time) */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-[#15181E] border-r-2 border-b-2 border-[#01A17F] rotate-45 transform origin-center z-0 rounded-sm"></div>
          
          <div className="relative z-10 bg-white dark:bg-[#15181E] border-2 border-[#01A17F] rounded-3xl p-5 text-center shadow-[0_4px_20px_rgba(1,161,127,0.15)]">
            <p className="font-bold text-[18px] mb-2 text-[#01A17F]">WOW!</p>
            <p className="font-medium text-[15px] leading-relaxed">
              At this pace, you'll finish your first 3 lessons toward <span className="font-bold">[{careerTitle}]</span> this week.
            </p>
          </div>
        </div>

        {/* Large Fox Character */}
        <div className="relative w-48 h-48 animate-[bounce_3s_ease-in-out_infinite]">
          <Image src="/images/fox.png" alt="Fox mascot amazed" fill className="object-contain" />
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
