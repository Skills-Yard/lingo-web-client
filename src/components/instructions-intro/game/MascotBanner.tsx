import React from "react";
import { LevelConfig } from "../../../utils/types";

// Ported from lingo-website-client/src/components/programming-basic/sections/MascotBanner.tsx

interface MascotBannerProps {
  level: LevelConfig;
  collectedStar: boolean;
  success: boolean | null;
}

export function MascotBanner({ level, collectedStar, success }: MascotBannerProps) {
  return (
    <div className="w-full bg-white dark:bg-[#111722] border border-slate-200 dark:border-[#1e293b] shadow-xs rounded-2xl p-3 flex gap-3 items-center mb-2 select-none transition-colors">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/lumis-wayfing.png"
          alt="Lumi"
          className="w-14 h-14 object-contain"
          style={{ filter: "url(#chroma-white)" }}
        />
      </div>
      <div className="grow min-w-0">
        <h2 className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{level.subtitle}</h2>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">{level.instructions}</p>
      </div>
      <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-[#182232] border border-slate-200 dark:border-[#22365a] rounded-xl shrink-0 min-w-14">
        {level.starPos ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/star.png" alt="Star" className="w-5 h-5 object-contain animate-bounce" />
            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 mt-1">{collectedStar ? "1/1" : "0/1"}</span>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/red-flag.webp" alt="Flag" className="w-5 h-5 object-contain" />
            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 mt-1">{success === true ? "1/1" : "0/1"}</span>
          </>
        )}
      </div>
    </div>
  );
}
