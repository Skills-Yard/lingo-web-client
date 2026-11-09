"use client";

import { Play, RotateCcw } from "lucide-react";
import { ChipList, chipListSize, moveItem, type PlanItem } from "@/components/sequence/ChipList";
import type { Command } from "@/components/sequence/hexGrid";
import { PillButton } from "../buttons/PillButton";
import { feelTap } from "../feel";
import { COMMAND_LOOK } from "./commands";

export type { PlanItem };

export type ProgramBuilderProps = {
  /** The commands the learner can add. */
  palette: readonly Command[];
  /** The program so far, in order. */
  items: readonly PlanItem[];
  /** How many commands fit. */
  max: number;
  onChange: (items: PlanItem[]) => void;
  /** Run is pressed. */
  onRun?: () => void;
  /** Start over is pressed (leave out for no button). */
  onReset?: () => void;
  /** The program is being carried out: it can't be changed. */
  running?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Where a learner writes a program: buttons to add a command, the program as numbered
 * chips over empty places (drag a chip to move it, tap it to take it out), and Run.
 */
export function ProgramBuilder({ palette, items, max, onChange, onRun, onReset, running = false, disabled = false, className = "" }: ProgramBuilderProps) {
  const locked = running || disabled;
  const add = (command: Command) => {
    if (locked || items.length >= max) return;
    feelTap();
    onChange([...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, command }]);
  };
  const { width, height } = chipListSize(max);
  return (
    <div className={`flex w-full flex-col items-center gap-3 ${className}`}>
      <div className="relative shrink-0" style={{ width, height }}>
        <ChipList
          items={items}
          max={max}
          disabled={locked}
          onMove={(from, to) => onChange(moveItem(items, from, to))}
          onRemove={(index) => onChange(items.filter((_, at) => at !== index))}
        />
      </div>
      <div className="flex w-full justify-center gap-2.5">
        {palette.map((command) => {
          const { Icon, tint, icon, label } = COMMAND_LOOK[command];
          return (
            <button
              key={command}
              type="button"
              disabled={locked || items.length >= max}
              onClick={() => add(command)}
              className={`pointer-events-auto flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[3px] border-white px-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-transform enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#818185] ${tint}`}
            >
              <Icon aria-hidden className={`size-5 shrink-0 ${icon}`} strokeWidth={3} />
              <span className="text-[11px] leading-[14px] font-semibold tracking-[0.2px] text-[#444444] uppercase dark:text-white">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2.5">
        {onReset && <PillButton look="outline" label="Start over" icon={<RotateCcw aria-hidden className="size-4" />} onClick={onReset} disabled={running || items.length === 0} />}
        {onRun && <PillButton label="Run" icon={<Play aria-hidden className="size-4 fill-white" />} onClick={onRun} disabled={locked || items.length === 0} />}
      </div>
    </div>
  );
}
