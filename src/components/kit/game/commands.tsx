import { ArrowUp, RotateCw, type LucideIcon } from "lucide-react";
import { COMMAND_LABEL, type Command } from "@/components/sequence/hexGrid";

/** How each command looks on a card: its icon, its colour, its words. */
export const COMMAND_LOOK: Record<Command, { Icon: LucideIcon; tint: string; icon: string; label: string }> = {
  forward: { Icon: ArrowUp, tint: "bg-[#EDFAFE] dark:bg-[#15233A]", icon: "text-[#0F88E5]", label: COMMAND_LABEL.forward },
  right: { Icon: RotateCw, tint: "bg-[#FEF8EC] dark:bg-[#2A2218]", icon: "text-[#E07B1F]", label: COMMAND_LABEL.right },
};

/** The commands Hex can be given. */
export const COMMANDS: readonly Command[] = ["forward", "right"];

/** The commands in the order they run, in one row: numbered cards that can't be moved. The one being carried out (if any) is ringed. */
export function CommandCards({ commands, active = -1, className = "" }: { commands: readonly Command[]; active?: number; className?: string }) {
  // Four take narrower cards than two.
  const width = commands.length > 3 ? 80 : 108;
  return (
    <ol className={`flex justify-center gap-1.5 ${className}`}>
      {commands.map((command, index) => {
        const { Icon, tint, icon, label } = COMMAND_LOOK[command];
        return (
          <li
            key={index}
            style={{ width }}
            className={`relative flex h-[84px] flex-col items-center justify-center gap-1 rounded-[8px] border-4 border-white px-0.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-[#818185] ${tint} ${index === active ? "ring-2 ring-[#04ACAB]" : ""}`}
          >
            <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#D9DEE3] text-[10px] font-semibold text-[#5C6670] dark:border-[#818185] dark:bg-[#3A3F47] dark:text-white">{index + 1}</span>
            <Icon aria-hidden className={`size-7 shrink-0 ${icon}`} strokeWidth={3} />
            <span className="text-center text-[11px] leading-[14px] font-semibold tracking-[0.2px] text-[#444444] uppercase dark:text-white">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
