import React from "react";
import { CommandType } from "../../../utils/types";
import { Play, RotateCcw } from "lucide-react";

// Ported from lingo-website-client/src/components/programming-basic/sections/GameFooter.tsx

interface GameFooterProps {
  isPlaying: boolean;
  success: boolean | null;
  commands: (CommandType | null)[];
  runSequence: () => void;
  resetLevel: () => void;
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void;
}

export function GameFooter({
  isPlaying,
  success,
  commands,
  runSequence,
  resetLevel,
  triggerSound,
}: GameFooterProps) {
  const hasActiveCommands = commands.filter((c) => c !== null).length > 0;

  return (
    <footer className="w-full flex justify-between gap-3 mb-2 select-none">
      <button
        type="button"
        onClick={() => {
          triggerSound("tap");
          resetLevel();
        }}
        className="flex items-center gap-2 justify-center py-3 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-[#111722] dark:border-[#1e293b] dark:hover:bg-[#182232] text-slate-700 dark:text-slate-200 font-extrabold text-sm shadow-xs active:scale-98 transition-all w-1/3 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset</span>
      </button>

      <button
        type="button"
        onClick={runSequence}
        disabled={isPlaying || success !== null || !hasActiveCommands}
        className={`grow flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-extrabold text-sm shadow-md active:scale-98 transition-all cursor-pointer ${
          !hasActiveCommands
            ? "bg-slate-200 text-slate-400 border border-slate-300 dark:bg-[#182232] dark:border-[#1e293b] dark:text-slate-500 cursor-not-allowed shadow-none"
            : isPlaying
            ? "bg-emerald-600 dark:bg-emerald-500 animate-pulse"
            : "bg-[#059669] hover:bg-[#047857] dark:bg-[#10b981] dark:hover:bg-[#059669]"
        }`}
      >
        {isPlaying ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Executing…</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run Program</span>
          </>
        )}
      </button>
    </footer>
  );
}
