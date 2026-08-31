"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import type { CommandsGridSlide } from "@/lib/constants/instructionsIntro";

interface CommandsGridScreenProps {
  slide: CommandsGridSlide;
  onCommand?: (commandId: string) => void;
}

export function CommandsGridScreen({ slide, onCommand }: CommandsGridScreenProps) {
  const [selectedCommands, setSelectedCommands] = useState<Set<string>>(
    new Set()
  );

  const handleCommandClick = (commandId: string) => {
    const next = new Set(selectedCommands);
    if (next.has(commandId)) next.delete(commandId);
    else next.add(commandId);
    setSelectedCommands(next);
    onCommand?.(commandId);
  };

  const colClass =
    slide.columns === 2
      ? "grid-cols-2"
      : slide.columns === 3
        ? "grid-cols-3"
        : slide.columns === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="flex flex-col gap-5 md:mx-auto md:max-w-2xl md:min-h-full md:justify-center">
      {/* ── Header — Frame 60 style: "Let's" accent + rest in ink ── */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-semibold leading-[1.34] tracking-tight text-[#2C2C2C] dark:text-white">
          <span className="text-primary">{slide.highlightWord}</span>{" "}
          {slide.title}
        </h1>
        {slide.description && (
          <p className="mt-2 text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
            {slide.description}
          </p>
        )}
      </div>

      {/* ── Commands grid — Frame 12/61/62 card language ── */}
      <div className={`grid gap-[18px] ${colClass}`}>
        {slide.commands.map((command) => {
          const isSelected = selectedCommands.has(command.id);

          return (
            <button
              key={command.id}
              type="button"
              onClick={() => handleCommandClick(command.id)}
              className={`relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[12px] px-3 py-4 transition-all active:scale-[0.98] ${
                isSelected
                  ? "border border-primary [background:linear-gradient(180deg,#FFFFFF_1.3%,#EEFAF6_67.42%)] dark:[background:linear-gradient(180deg,#15181E_1.3%,#0F2921_67.42%)]"
                  : "cursor-pointer border border-black/[0.04] bg-white shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] hover:border-primary/40 dark:border-white/[0.06] dark:bg-[#15181E]"
              }`}
            >
              {command.icon && (
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#E9F5F0] dark:bg-[#0F2921]">
                  <Image
                    src={command.icon}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                </span>
              )}

              <span className="text-center text-[13px] font-medium leading-tight text-[#2C2C2C] dark:text-white">
                {command.label}
              </span>

              {isSelected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Info message — soft green wash, matches the feedback panels ── */}
      {slide.infoMessage && (
        <div className="rounded-[12px] p-4 [background:linear-gradient(180deg,rgba(223,255,248,0.68)_0%,rgba(255,255,255,0)_98.7%)] dark:[background:linear-gradient(180deg,rgba(1,161,127,0.20)_0%,rgba(255,255,255,0)_98.7%)]">
          <p className="text-sm font-medium leading-[1.4] text-[#2C2C2C] dark:text-neutral-200">
            {slide.infoMessage}
          </p>
        </div>
      )}
    </div>
  );
}
