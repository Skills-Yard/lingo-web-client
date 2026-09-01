import React from "react";
import { LevelConfig, CommandType } from "./types";
import { COMMAND_DETAILS } from "./commands";

// Ported from lingo-website-client/src/components/programming-basic/sections/CommandPalette.tsx

interface CommandPaletteProps {
  level: LevelConfig;
  isPlaying: boolean;
  success: boolean | null;
  addCommand: (type: CommandType) => void;
}

export function CommandPalette({ level, isPlaying, success, addCommand }: CommandPaletteProps) {
  return (
    <div className="w-full bg-white dark:bg-[#111722] border border-slate-200 dark:border-[#1e293b] shadow-xs rounded-2xl p-2.5 mb-2 select-none transition-colors">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase text-center mb-2">Available Actions</p>
      <div className="flex justify-between gap-2 px-1">
        {(Object.keys(COMMAND_DETAILS) as CommandType[]).map((type) => {
          const d = COMMAND_DETAILS[type];
          const disabled = type === "pickup" && !level.starPos;
          return (
            <button
              key={type}
              type="button"
              onClick={() => addCommand(type)}
              disabled={isPlaying || success !== null || disabled}
              className={`flex-1 p-0 rounded-2xl bg-transparent border-0 shadow-sm transition-all cursor-pointer ${
                disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.imageSrc} alt={d.label} className="w-full h-auto object-contain" draggable={false} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
