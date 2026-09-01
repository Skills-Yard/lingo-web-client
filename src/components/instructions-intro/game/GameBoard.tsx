import React from "react";
import { DemoPlatform } from "./DemoPlatform";
import { Level1Platform } from "./Level1Platform";
import { LevelConfig, CommandType, Position, Direction } from "./types";

// Ported from lingo-website-client/src/components/programming-basic/sections/GameBoard.tsx

interface GameBoardProps {
  level: LevelConfig;
  commands: (CommandType | null)[];
  isPlaying: boolean;
  playerPos: Position;
  playerDir: Direction;
  executingStep: number | null;
  collectedStar: boolean;
  soundEnabled: boolean;
  fillHint: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void;
}

export function GameBoard({
  level,
  commands,
  isPlaying,
  playerPos,
  playerDir,
  executingStep,
  collectedStar,
  soundEnabled,
  fillHint,
  setSoundEnabled,
  triggerSound,
}: GameBoardProps) {
  const stepsLeft = commands.filter((c) => c === null).length;

  return (
    <div className="relative w-full bg-white dark:bg-[#111722] border border-slate-200 dark:border-[#1e293b] shadow-xs rounded-3xl p-3.5 mb-2 flex flex-col items-center transition-colors">
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
        <span
          className={`pointer-events-auto text-white font-black text-[10px] px-3 py-1 rounded-full shadow-xs ${
            level.isDemo ? "bg-amber-500" : "bg-emerald-600 dark:bg-emerald-500"
          }`}
        >
          Steps left: {stepsLeft}
        </span>
        <div className="pointer-events-auto flex gap-1.5">
          <button
            type="button"
            onClick={fillHint}
            disabled={isPlaying}
            className="flex items-center gap-1 bg-slate-50 hover:bg-amber-50 dark:bg-[#182232] dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-200 dark:border-[#22365a] hover:border-amber-300 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            💡 Hint
          </button>
          <button
            type="button"
            onClick={() => {
              triggerSound("tap");
              setSoundEnabled(!soundEnabled);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-xl border shadow-xs transition-all cursor-pointer ${
              soundEnabled
                ? "bg-white dark:bg-[#182232] border-slate-200 dark:border-[#22365a] text-slate-700 dark:text-slate-200"
                : "bg-slate-100 dark:bg-[#182232]/50 border-slate-300 dark:border-slate-800 text-slate-400"
            }`}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      <div className="w-full flex items-center justify-center py-4 overflow-visible relative">
        {level.isDemo ? (
          <DemoPlatform playerPos={playerPos} playerDir={playerDir} isPlaying={isPlaying} executingStep={executingStep} />
        ) : (
          <Level1Platform
            playerPos={playerPos}
            playerDir={playerDir}
            isPlaying={isPlaying}
            executingStep={executingStep}
            collectedStar={collectedStar}
          />
        )}
      </div>
    </div>
  );
}
