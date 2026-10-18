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
  /** The move to show highlighted (Level 1: the last one added). */
  selected?: CommandType | null;
}

/** The Level 1 screen's buttons: no pick-up, two by two, in this order. */
const TILE_ORDER: readonly { type: CommandType; Icon: LucideIcon }[] = [
  { type: "straight", Icon: ArrowUp },
  { type: "left", Icon: CornerUpLeft },
  { type: "back", Icon: ArrowDown },
  { type: "right", Icon: CornerUpRight },
];

export function CommandPalette({ level, isPlaying, success, addCommand, borderless, selected }: CommandPaletteProps) {
  if (borderless) {
    return (
      <div className="mx-auto grid w-fit grid-cols-[131px_131px] gap-x-3.5 gap-y-3 select-none">
        {TILE_ORDER.map(({ type, Icon }) => {
          // The last move added keeps the highlighted look.
          const chosen = type === selected;
          return (
            <button
              key={type}
              type="button"
              onClick={() => addCommand(type)}
              disabled={isPlaying || success !== null}
              className={`flex h-[84px] w-[131px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-all active:scale-95 disabled:cursor-default ${
                chosen
                  ? "border-[#444444] border-b-2 bg-[linear-gradient(112.32deg,#49C1AE_10.64%,#02B1AA_82.74%)]"
                  : "border-[#CEE8DF] border-b-[6px] bg-white disabled:opacity-60 dark:border-[#1F4A44] dark:bg-[#15181E]"
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  chosen ? "bg-white text-[#36BDAD]" : "bg-[linear-gradient(180deg,#06A788,#2AD2BC)] text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.8} />
              </span>
              <span
                className={`shrink-0 font-[Inter,sans-serif] text-[14px] leading-[1.4] font-medium ${
                  chosen ? "text-white" : "text-[#444444] dark:text-white"
                }`}
              >
                {COMMAND_DETAILS[type].label}
              </span>
            </button>
          );
        })}
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
