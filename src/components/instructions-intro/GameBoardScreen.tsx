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
import { SpeechBubble } from "./SpeechBubble";
import { RobuAnchor, ROBU_DEFAULT_SIZE } from "./RobuAnchor";
import { motion } from "framer-motion";

interface GameBoardScreenProps {
  slide: GameSlide;
  /** Fired once the puzzle is solved, so the flow can enable its "Continue" CTA. */
  onSolvedChange: (solved: boolean) => void;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  /** Registers where Robu (a single persistent mascot — see RobuStage)
   * should stand. He arrives here in the header first, same as every other
   * screen, then — after `JOIN_GAME_DELAY_MS` — this component hands the
   * anchor off to the actual player tile inside the board (see
   * GameBoard/Level1Platform/DemoPlatform): Robu himself becomes the player
   * piece, walking the grid as commands execute, rather than a second,
   * separate mascot rendered inside the board alongside a still one up
   * here. Once he leaves, the header's bubble expands to the full row since
   * there's no icon left to share it with. */
  registerAnchor: (el: HTMLDivElement | null) => void;
}

const LEVEL = lesson1Level;

// How long Robu stands at the header (like every other screen's arrival)
// before he glides down into the board and becomes the player piece.
const JOIN_GAME_DELAY_MS = 1000;

export function GameBoardScreen({
  slide,
  onSolvedChange,
  instantSpeech,
  registerAnchor,
}: GameBoardScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const triggerSound = useSound(soundEnabled);

  // False for the first `JOIN_GAME_DELAY_MS` (Robu's still at the header),
  // then true for the rest of this screen's life. Reset on remount only
  // (slide change), not on any other re-render.
  const [robuJoinedGame, setRobuJoinedGame] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(
      () => setRobuJoinedGame(true),
      JOIN_GAME_DELAY_MS,
    );
    return () => window.clearTimeout(t);
  }, []);

  const gameState = useGameState(
    LEVEL,
    triggerSound,
    soundEnabled,
    setSoundEnabled,
  );
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

  const { canvasRef, runSequence } = useGameExecution({
    level: LEVEL,
    gameState,
    triggerSound,
  });

  // Latch: once solved, stay solved so "Continue" stays available even after a reset.
  useEffect(() => {
    if (success === true) onSolvedChange(true);
  }, [success, onSolvedChange]);

  return (
    <div className="flex flex-col gap-3 md:mx-auto md:max-w-xl lg:max-w-4xl md:min-h-full md:justify-center">
      {/* ── Header — Robu stands here for the first beat (same arrival every
          other screen gets), then leaves for the board once he joins the
          game; his icon un-reserves that space the instant he does, so the
          bubble/description expand to the full row on their own — nothing
          else here needs to change to make room. ── */}
      <div className="flex-col items-center justify-center gap-3 md:justify-start">
        <motion.div
          layout
          className="flex w-full flex-wrap items-start justify-center"
          transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
        >
          {!robuJoinedGame && (
            <RobuAnchor
              registerAnchor={registerAnchor}
              className={`shrink-0 ${ROBU_DEFAULT_SIZE}`}
            />
          )}

          <motion.div
            layout
            transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
            className="-ml-12 shrink-0 sm:-ml-4 md:ml-0"
          >
            <SpeechBubble
              text={`${slide.highlightWord} ${slide.title}`}
              highlight={slide.highlightWord}
              instant={instantSpeech}
              size="lg"
              tailCorner="bottom-left"
            />
          </motion.div>
        </motion.div>
        <div className="text-center md:text-left">
          {/* A real bubble here (not the "heading" style every other
              screen's title uses) — this one's paired with Robu's own icon
              for a moment before he leaves for the board, so it reads as
              him actually saying it rather than a page title. */}

          {slide.description && (
            <p className="mt-2 text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
              {slide.description}
            </p>
          )}
        </div>
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
            registerAnchor={registerAnchor}
            robuJoinedGame={robuJoinedGame}
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

          <CommandPalette
            level={LEVEL}
            isPlaying={isPlaying}
            success={success}
            addCommand={addCommand}
          />

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
                success === true
                  ? "text-primary"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {success === true
                ? "Nice! You reached the flag."
                : "Not quite yet."}
            </h3>
            <p
              className={`text-xs font-medium leading-[1.4] mt-0.5 ${
                success === true
                  ? "text-primary"
                  : "text-rose-600 dark:text-rose-400"
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
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-50"
        />
      )}

      {/* SVG colour-key filter used by the platform art (see lingo-website-client GameView) */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="chroma-white" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -2 -2 -2 6 -0.05"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
