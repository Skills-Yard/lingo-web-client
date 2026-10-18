import React from "react";
import { ArrowDown, ArrowUp, CornerUpLeft, CornerUpRight, Hand, Play, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CommandType } from "../../../utils/types";

const MOVE_ICONS: Record<CommandType, LucideIcon> = {
  straight: ArrowUp,
  left: CornerUpLeft,
  right: CornerUpRight,
  back: ArrowDown,
  pickup: Hand,
};

interface MovesBarProps {
  commands: (CommandType | null)[];
  isPlaying: boolean;
  success: boolean | null;
  executingStep: number | null;
  removeCommand: (idx: number) => void;
  runSequence: () => void;
  resetLevel: () => void;
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void;
}

/**
 * The Level 1 program bar (an inset grey strip): a "MOVES" label, one slot per command (dark tile
 * with the move's icon once filled; the next one to fill glows), then Reset
 * and Play at the right end.
 */
export function MovesBar({
  commands,
  isPlaying,
  success,
  executingStep,
  removeCommand,
  runSequence,
  resetLevel,
  triggerSound,
}: MovesBarProps) {
  const nextSlot = isPlaying || success !== null ? -1 : commands.findIndex((c) => c === null);
  const canRun = !isPlaying && success === null && commands.some((c) => c !== null);

  return (
    <div className="mx-auto mt-2 mb-3.5 flex h-11 w-full max-w-[358px] items-center gap-2 rounded bg-[#F4F6F8]/20 px-3 shadow-[inset_0_1px_13.1px_rgba(0,0,0,0.25)] select-none dark:bg-white/8">
      <span className="font-[Inter,sans-serif] text-[14px] leading-5 font-bold text-[#666666] dark:text-white/60">MOVES</span>

      <div className="flex items-center gap-1.5">
        {commands.map((command, idx) => {
          const active = executingStep === idx && isPlaying;
          if (!command) {
            return (
              <span
                key={idx}
                className={`h-[27px] w-[27px] shrink-0 rounded-lg bg-slate-200/80 dark:bg-white/10 ${
                  idx === nextSlot
                    ? "animate-pulse bg-emerald-100 ring-2 ring-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.55)] dark:bg-emerald-500/20"
                    : ""
                }`}
              />
            );
          }
          const Icon = MOVE_ICONS[command];
          return (
            <button
              key={idx}
              type="button"
              aria-label={`Remove ${command}`}
              onClick={() => removeCommand(idx)}
              disabled={isPlaying || success !== null}
              className={`flex h-[27px] w-[27px] shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#444444] text-white transition-all disabled:cursor-default ${
                active ? "scale-110 ring-2 ring-emerald-400" : "active:scale-90"
              }`}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={3} />
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Reset"
          onClick={() => {
            triggerSound("tap");
            resetLevel();
          }}
          className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-white text-slate-600 shadow-xs transition-transform active:scale-90 dark:bg-white/10 dark:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Run program"
          disabled={!canRun}
          onClick={runSequence}
          className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
