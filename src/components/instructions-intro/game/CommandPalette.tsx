import React from "react";
import { ArrowDown, ArrowUp, CornerUpLeft, CornerUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LevelConfig, CommandType } from "../../../utils/types";
import { COMMAND_DETAILS } from "../../../utils/data/commands";

// Ported from lingo-website-client/src/components/programming-basic/sections/CommandPalette.tsx

interface CommandPaletteProps {
  level: LevelConfig;
  isPlaying: boolean;
  success: boolean | null;
  addCommand: (type: CommandType) => void;
  /** Drops the card border (the Level 1 screen). */
  borderless?: boolean;
}

/** The Level 1 screen's buttons: no pick-up, two by two, in this order. */
const TILE_ORDER: readonly { type: CommandType; Icon: LucideIcon }[] = [
  { type: "straight", Icon: ArrowUp },
  { type: "left", Icon: CornerUpLeft },
  { type: "back", Icon: ArrowDown },
  { type: "right", Icon: CornerUpRight },
];

export function CommandPalette({ level, isPlaying, success, addCommand, borderless }: CommandPaletteProps) {
  if (borderless) {
    return (
      <div className="grid w-full grid-cols-2 gap-x-3 gap-y-2.5 px-1 select-none">
        {TILE_ORDER.map(({ type, Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addCommand(type)}
            disabled={isPlaying || success !== null}
            // The mint bottom edge is the 5px border; the card sits on it.
            className="flex h-[66px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-b-[5px] border-[#D4EEE6] bg-white shadow-[0_1px_8px_-4px_rgba(0,0,0,0.2)] transition-transform active:scale-95 disabled:cursor-default disabled:opacity-60 dark:border-[#1F4A44] dark:bg-[#15181E]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3F3F3F] text-white dark:bg-white/20">
              <Icon className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <span className="text-[13px] leading-none font-medium text-[#2C2C2C] dark:text-white">
              {COMMAND_DETAILS[type].label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white dark:bg-[#111722] ${borderless ? "" : "border border-slate-200 dark:border-[#1e293b] "}shadow-xs rounded-2xl p-2.5 mb-2 select-none transition-colors`}>
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
