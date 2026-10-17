import React from "react";
import { CommandType } from "../../../utils/types";
import { COMMAND_DETAILS } from "../../../utils/data/commands";

// Extracted from GameBoard so it can sit in the left-hand control column beside the board.

interface ProgramSlotsProps {
  commands: (CommandType | null)[];
  isPlaying: boolean;
  success: boolean | null;
  executingStep: number | null;
  removeCommand: (idx: number) => void;
  /** Drops the card border (the Level 1 screen). */
  borderless?: boolean;
  /** Tiny, chrome-less row of slots (no card, title or numbers). */
  compact?: boolean;
}

export function ProgramSlots({
  commands,
  isPlaying,
  success,
  executingStep,
  removeCommand,
  borderless,
  compact,
}: ProgramSlotsProps) {
  if (compact) {
    // The slot the next command lands in glows until the run starts.
    const nextSlot = isPlaying || success !== null ? -1 : commands.findIndex((c) => c === null);
    return (
      <div className="flex items-center gap-1.5 select-none">
        {commands.map((cmd, idx) => {
          const active = executingStep === idx && isPlaying;
          return cmd ? (
            <button
              key={idx}
              type="button"
              onClick={() => removeCommand(idx)}
              disabled={isPlaying || success !== null}
              className={`h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-transparent p-0 transition-all ${
                active ? "scale-110 ring-2 ring-emerald-500" : "active:scale-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COMMAND_DETAILS[cmd].imageSrc} alt={COMMAND_DETAILS[cmd].label} className="h-full w-full object-contain" draggable={false} />
            </button>
          ) : (
            <span
              key={idx}
              className={`h-9 w-9 shrink-0 rounded-lg bg-slate-200/70 dark:bg-white/10 ${
                idx === nextSlot ? "animate-pulse bg-emerald-100 ring-2 ring-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.55)] dark:bg-emerald-500/20" : ""
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white dark:bg-[#111722] ${borderless ? "" : "border border-slate-200 dark:border-[#1e293b] "}shadow-xs rounded-2xl p-3 mb-2 select-none transition-colors`}>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase text-center mb-2">Program Slots</p>
      <div className="flex flex-wrap justify-center gap-2">
        {commands.map((cmd, idx) => {
          const active = executingStep === idx && isPlaying;
          return (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1">{idx + 1}</span>
              {cmd ? (
                <button
                  type="button"
                  onClick={() => removeCommand(idx)}
                  disabled={isPlaying || success !== null}
                  className={`w-12 h-12 shadow-sm rounded-2xl overflow-hidden transition-all p-0 bg-transparent cursor-pointer ${
                    active ? "scale-110 -translate-y-1 ring-2 ring-emerald-500" : `hover:scale-105 active:scale-95 ${borderless ? "" : "border border-slate-200 dark:border-slate-700"}`
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={COMMAND_DETAILS[cmd].imageSrc}
                    alt={COMMAND_DETAILS[cmd].label}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </button>
              ) : (
                <div className={`w-12 h-12 rounded-2xl ${borderless ? "bg-slate-100 dark:bg-[#182232]/60" : "border-2 border-dashed border-slate-200 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#182232]/40"} flex items-center justify-center relative`}>
                  {idx === 0 && commands.filter((c) => c !== null).length === 0 && (
                    <div className="w-2.5 h-1 bg-emerald-500 rounded-full animate-ping absolute" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
