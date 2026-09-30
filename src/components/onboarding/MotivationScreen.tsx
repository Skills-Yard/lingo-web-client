"use client";

import { useState } from "react";
import Image from "next/image";

const MOTIVATIONS = [
  { id: "switch", label: "Switching careers into tech", icon: "placeholder-switch" },
  { id: "first-job", label: "Landing my first tech job", icon: "placeholder-job" },
  { id: "promotion", label: "Promotion in current role", icon: "placeholder-promo" },
  { id: "curiosity", label: "Personal project or curiosity", icon: "placeholder-curious" },
  { id: "freelance", label: "Freelance / side income", icon: "placeholder-freelance" },
];

export function MotivationScreen({ onNext, onBack, careerTitle = "Software Engineering" }: { onNext?: () => void; onBack?: () => void; careerTitle?: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0D1016] text-[#2C2C2C] dark:text-white font-sans max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 mb-6 shrink-0">
        <button onClick={onBack} className="p-2 text-gray-500 hover:text-black dark:hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-[#01A17F] mb-1">05/07</span>
          <div className="flex gap-1">
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="h-1 w-6 bg-[#01A17F] rounded-full"></div>
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="h-1 w-6 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
        <button className="p-2 text-gray-500 hover:text-black dark:hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-6 px-4 pb-6">
        <div className="flex items-center gap-4 px-2">
          {/* Fox Image Placeholder */}
          <div className="w-16 h-16 shrink-0 relative">
            <Image src="/images/fox.png" alt="Fox mascot" width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-xl font-semibold leading-snug">
            What&apos;s driving your move toward <span className="text-[#01A17F]">{careerTitle}</span>?
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          {MOTIVATIONS.map((motivation) => {
            const isSelected = selected === motivation.id;
            return (
              <button
                key={motivation.id}
                onClick={() => setSelected(motivation.id)}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all text-left
                  ${isSelected 
                    ? "border-[#01A17F] bg-[#E9F5F0] dark:bg-[#0F2921]" 
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#15181E] shadow-sm hover:border-[#01A17F]/30"
                  }`}
              >
                {/* Icon Placeholder */}
                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-xs text-gray-400">icon</span>
                </div>
                <span className="font-medium text-base">{motivation.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 shrink-0 p-4 bg-white dark:bg-[#0D1016] border-t border-gray-100 dark:border-gray-800 z-50">
        <button 
          onClick={onNext}
          disabled={!selected}
          className="w-full py-4 rounded-xl font-bold text-white bg-[#01A17F] disabled:opacity-50 transition-all flex items-center justify-center overflow-hidden relative"
        >
          {/* Subtle stripe effect for the continue button */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_25%,rgba(255,255,255,0.3)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.3)_75%,rgba(255,255,255,0.3)_100%)] bg-[length:20px_20px]"></div>
          <span className="relative z-10">Continue</span>
        </button>
      </div>
    </div>
  );
}
