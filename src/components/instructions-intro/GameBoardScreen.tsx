"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { GameSlide } from "@/lib/constants/instructionsIntro";
import { useSound } from "@/hooks/useSound";
import { lesson1Level } from "../../utils/data/levels";
import { useGameState } from "../../hooks/useGameState";
import { useGameExecution } from "../../hooks/useGameExecution";
import { GameBoard } from "./game/GameBoard";
import { ProgramSlots } from "./game/ProgramSlots";
import { CommandPalette } from "./game/CommandPalette";
import { GameFooter } from "./game/GameFooter";

interface GameBoardScreenProps {
  slide: GameSlide;
  /** Fired once the puzzle is solved, so the flow can enable its "Continue" CTA. */
  onSolvedChange: (solved: boolean) => void;
}

const LEVEL = lesson1Level;

export function GameBoardScreen({ slide, onSolvedChange }: GameBoardScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const triggerSound = useSound(soundEnabled);

  const gameState = useGameState(LEVEL, triggerSound, soundEnabled, setSoundEnabled);
  const {
    commands,
    isPlaying,
    playerPos,
    playerDir,
    executingStep,
    collectedStar,
    success,
    failureMsg,
    fillHint,
    removeCommand,
    addCommand,
    resetLevel,
  } = gameState;

  const { canvasRef, runSequence } = useGameExecution({ level: LEVEL, gameState, triggerSound });

  // Latch: once solved, stay solved so "Continue" stays available even after a reset.
  useEffect(() => {
    if (success === true) onSolvedChange(true);
  }, [success, onSolvedChange]);

  return (
    <div className="flex flex-col gap-3 md:mx-auto md:max-w-xl lg:max-w-4xl md:min-h-full md:justify-center">
      {/* ── Header — matches the other intro screens ── */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-semibold leading-[1.34] tracking-tight text-[#2C2C2C] dark:text-white">
          <span className="text-primary">{slide.highlightWord}</span> {slide.title}
        </h1>
        {slide.description && (
          <p className="mt-2 text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
            {slide.description}
          </p>
        )}
      </div>

      {/* Board on the left, controls on the right (stacked on small screens). */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-6">
        {/* ── Left column — the game board ── */}
        <div className="lg:order-1 lg:w-105 lg:shrink-0">
          <GameBoard
            level={LEVEL}
            commands={commands}
            isPlaying={isPlaying}
            playerPos={playerPos}
            playerDir={playerDir}
            executingStep={executingStep}
            collectedStar={collectedStar}
            soundEnabled={soundEnabled}
            fillHint={fillHint}
            setSoundEnabled={setSoundEnabled}
            triggerSound={triggerSound}
          />
        </div>

        {/* ── Right column — program slots, actions and run controls ── */}
        <div className="flex flex-col gap-3 lg:order-2 lg:w-100 lg:shrink-0">
          <ProgramSlots
            commands={commands}
            isPlaying={isPlaying}
            success={success}
            executingStep={executingStep}
            removeCommand={removeCommand}
          />

          <CommandPalette level={LEVEL} isPlaying={isPlaying} success={success} addCommand={addCommand} />

          <GameFooter
            isPlaying={isPlaying}
            success={success}
            commands={commands}
            runSequence={runSequence}
            resetLevel={resetLevel}
            triggerSound={triggerSound}
          />
        </div>
      </div>

      {/* ── Inline result banner (no CompletionModal in the intro flow) ── */}
      {success !== null && (
        <div
          className="w-full rounded-[8px] p-3.5 flex items-start gap-2.5 animate-pop-in"
          style={{
            background:
              success === true
                ? "linear-gradient(180deg, rgba(1,161,127,0.16) 0%, rgba(255,255,255,0) 98.7%)"
                : "linear-gradient(180deg, rgba(225,29,72,0.16) 0%, rgba(255,255,255,0) 98.7%)",
          }}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              success === true ? "bg-primary" : "bg-rose-600 dark:bg-rose-500"
            }`}
          >
            {success === true ? (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            ) : (
              <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className={`text-base font-semibold leading-tight ${
                success === true ? "text-primary" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {success === true ? "Nice! You reached the flag." : "Not quite yet."}
            </h3>
            <p
              className={`text-xs font-medium leading-[1.4] mt-0.5 ${
                success === true ? "text-primary" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {success === true
                ? "Tap Continue to keep going."
                : `${failureMsg} Tap Reset and try again.`}
            </p>
          </div>
        </div>
      )}

      {/* Confetti overlay on win */}
     {success === true && (
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />
      )}

      {/* SVG colour-key filter used by the platform art (see lingo-website-client GameView) */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="chroma-white" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -2 -2 -2 6 -0.05" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
