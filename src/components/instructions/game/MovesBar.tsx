import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, CornerUpLeft, CornerUpRight, Hand, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CommandType } from "../../../utils/types";

/** Low damping: the button overshoots a little on release. */
const PRESS_SPRING = { type: "spring", stiffness: 500, damping: 14 } as const;

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
  resetLevel: () => void;
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void;
}

/**
 * The Level 1 program bar (an inset grey strip): a "MOVES" label, one slot per command (dark tile
 * with the move's icon once filled; the next one to fill glows), then Reset
 * at the right end, beside how many steps are left. Play lives in the bottom row.
 */
export function MovesBar({
  commands,
  isPlaying,
  success,
  executingStep,
  removeCommand,
  resetLevel,
  triggerSound,
}: MovesBarProps) {
  const nextSlot = isPlaying || success !== null ? -1 : commands.findIndex((c) => c === null);
  const stepsLeft = commands.filter((c) => c === null).length;

  return (
    <div className="mb-4 flex h-14 w-[calc(100%-50px)] items-center gap-2 overflow-hidden rounded-[16px] bg-[#F4F6F8]/20 pl-3 shadow-[inset_0_1px_13.1px_rgba(0,0,0,0.25)] select-none dark:bg-white/8">
      <span className="font-sans text-[16px] leading-6 font-bold text-[#666666] dark:text-white/60">MOVES</span>

      <div className="flex items-center gap-1.5">
        {commands.map((command, idx) => {
          const active = executingStep === idx && isPlaying;
          if (!command) {
            return (
              <span
                key={idx}
                className={`h-[33px] w-[33px] shrink-0 rounded-lg bg-slate-200/80 dark:bg-white/10 ${
                  idx === nextSlot
                    ? "animate-pulse bg-emerald-100 ring-2 ring-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.55)] dark:bg-emerald-500/20"
                    : ""
                }`}
              />
            );
          }
          const Icon = MOVE_ICONS[command];
          return (
            <motion.button
              key={idx}
              type="button"
              whileTap={{ scale: 0.88, y: 2 }}
              transition={PRESS_SPRING}
              aria-label={`Remove ${command}`}
              onClick={() => removeCommand(idx)}
              disabled={isPlaying || success !== null}
              className={`flex h-[33px] w-[33px] shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#444444] text-white transition-[box-shadow,background-color] disabled:cursor-default ${
                active ? "scale-110 ring-2 ring-emerald-400" : ""
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={3} />
            </motion.button>
          );
        })}
      </div>

      <div className="ml-auto flex h-full items-center gap-3">
        <span className="font-sans text-[16px] leading-6 font-bold whitespace-nowrap text-[#666666] dark:text-white/60">
          Steps left: {stepsLeft}
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88, y: 2 }}
          transition={PRESS_SPRING}
          aria-label="Reset"
          onClick={() => {
            triggerSound("tap");
            resetLevel();
          }}
          className="flex h-full w-14 cursor-pointer items-center justify-center rounded-none bg-[#444444] text-white"
        >
          <RotateCcw className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
