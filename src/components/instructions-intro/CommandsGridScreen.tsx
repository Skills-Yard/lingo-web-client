"use client";

import { useState } from "react";
import Image from "next/image";
import type { CommandsGridSlide, CommandItem } from "@/lib/constants/instructionsIntro";

interface CommandsGridScreenProps {
  slide: CommandsGridSlide;
  onCommand?: (commandId: string) => void;
}

export function CommandsGridScreen({
  slide,
  onCommand,
}: CommandsGridScreenProps) {
  const [selectedCommands, setSelectedCommands] = useState<Set<string>>(
    new Set()
  );

  const handleCommandClick = (commandId: string) => {
    const newSelected = new Set(selectedCommands);
    if (newSelected.has(commandId)) {
      newSelected.delete(commandId);
    } else {
      newSelected.add(commandId);
    }
    setSelectedCommands(newSelected);
    onCommand?.(commandId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          <span className="text-primary">{slide.highlightWord}</span>{" "}
          <span className="text-foreground">{slide.title}</span>
        </h1>
        {slide.description && (
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            {slide.description}
          </p>
        )}
      </div>

      {/* Commands Grid */}
      <div className={`grid gap-4 ${
        slide.columns === 2 ? "grid-cols-2" : 
        slide.columns === 3 ? "grid-cols-3" : 
        slide.columns === 4 ? "grid-cols-4" : 
        "grid-cols-2 md:grid-cols-4"
      }`}>
        {slide.commands.map((command) => (
          <button
            key={command.id}
            onClick={() => handleCommandClick(command.id)}
            className={`relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border-2 transition-all cursor-pointer ${
              selectedCommands.has(command.id)
                ? "border-primary bg-primary/10 dark:bg-primary/20 scale-105"
                : "border-border bg-background hover:border-primary/50 dark:border-neutral-700"
            }`}
          >
            {/* Command Icon/Image */}
            {command.icon && (
              <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                <Image
                  src={command.icon}
                  alt={command.label}
                  width={60}
                  height={60}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            {/* Command Label */}
            <p className="text-xs md:text-sm font-semibold text-center text-foreground leading-tight">
              {command.label}
            </p>

            {/* Selected Indicator */}
            {selectedCommands.has(command.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Message */}
      {slide.infoMessage && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            {slide.infoMessage}
          </p>
        </div>
      )}
    </div>
  );
}
