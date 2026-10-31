"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import { Move, X } from "lucide-react";
import type { GameSlide } from "@/lib/constants/instructionsIntro";
import { useSound } from "@/hooks/useSound";
import { lesson1Level } from "../../utils/data/levels";
import { useGameState } from "../../hooks/useGameState";
import { useGameExecution } from "../../hooks/useGameExecution";
import { GameBoard } from "./game/GameBoard";
import { ProgramSlots } from "./game/ProgramSlots";
import { CommandPalette } from "./game/CommandPalette";
import { GameFooter } from "./game/GameFooter";
import { MovesBar } from "./game/MovesBar";
import { SpeechBubble } from "./SpeechBubble";
import {
  RobuAnchor,
  ROBU_DEFAULT_SIZE,
  ROBU_TRAILING_GAP_PULL,
} from "./RobuAnchor";
import { motion, useReducedMotion } from "framer-motion";

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
  /** Drops the borders on the board, slots and actions cards. */
  borderless?: boolean;
  /** Time between two commands of a run (default 700ms). */
  stepMs?: number;
  /** Fired once a run has ended, whether it reached the flag or not. */
  onFinishedChange?: (finished: boolean) => void;
  /** Filled with the hint action (fills the slots) once the board is live, so
   * the screen's own hint button can trigger it. */
  hintRef?: MutableRefObject<(() => void) | null>;
  /** Filled with the run action while a run can start (the board is live and
   * a command has been entered), so the screen's own Play button can start it. */
  playRef?: MutableRefObject<(() => void) | null>;
  /** Fired when a run can start / is running — for the screen's Play button. */
  onRunStateChange?: (state: { canRun: boolean; running: boolean }) => void;
  /** Fired with how the latest run went: null while there is none (start,
   * after a reset), true on the flag, false on a miss (with what went wrong). */
  onResultChange?: (result: { success: boolean | null; failureMsg: string }) => void;
  /** Filled with the reset action (back to the start, empty slots). */
  resetRef?: MutableRefObject<(() => void) | null>;
}

const LEVEL = lesson1Level;

/** The Level 1 heading, in the pieces that are typed (the accent is teal). */
const HEADING_TEXT_PARTS = [
  { text: "Command", accent: true },
  { text: " Hex", accent: false },
] as const;
/** Each part with the number of letters typed before it. */
const HEADING_PARTS = HEADING_TEXT_PARTS.map((part, i) => ({
  ...part,
  offset: HEADING_TEXT_PARTS.slice(0, i).reduce((n, p) => n + p.text.length, 0),
}));
/** The heading as words of letters (each letter keeps its place in the whole
 * text, for typing and for the stagger), so a word never breaks across lines. */
const HEADING_WORDS = (() => {
  const words: { char: string; accent: boolean; index: number }[][] = [[]];
  let index = 0;
  for (const part of HEADING_TEXT_PARTS) {
    for (const char of part.text) {
      if (char === " ") words.push([]);
      else words[words.length - 1].push({ char, accent: part.accent, index });
      index += 1;
    }
  }
  return words.filter((word) => word.length > 0);
})();
const HEADING_LENGTH = HEADING_TEXT_PARTS.reduce((n, part) => n + part.text.length, 0);
const TYPE_MS = 45;
/** Pause between the heading finishing and the game starting. */
const START_DELAY_MS = 500;

// How long Robu stands at the header (like every other screen's arrival)
// before he glides down into the board and becomes the player piece.
const JOIN_GAME_DELAY_MS = 1000;

/** Hex's header slot: top / right / width as ratios of the screen. */
const HEX_SLOT_CLASS =
  "absolute top-[calc(var(--stage-h)*-0.057)] right-[1%] aspect-[190/170] w-[48.7%] shrink-0";

export function GameBoardScreen({
  slide,
  onSolvedChange,
  instantSpeech,
  registerAnchor,
  borderless,
  stepMs,
  onFinishedChange,
  hintRef,
  playRef,
  onRunStateChange,
  onResultChange,
  resetRef,
}: GameBoardScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const triggerSound = useSound(soundEnabled);

  // False for the first `JOIN_GAME_DELAY_MS` (Robu's still at the header),
  // then true for the rest of this screen's life. Reset on remount only
  // (slide change), not on any other re-render.
  const [robuJoinedGame, setRobuJoinedGame] = useState(false);
  // Level 1 (`borderless`): the board stays greyed out and locked while the
  // heading types itself; a beat after it's done the game starts by itself
  // and the character goes onto the platform.
  const [ready, setReady] = useState(false);
  const locked = borderless && !ready;

  // The Level 1 heading types itself in.
  const reducedMotion = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const typedAll = typed >= HEADING_LENGTH;
  useEffect(() => {
    if (!borderless || !typedAll) return;
    const timer = window.setTimeout(() => {
      setReady(true);
      setRobuJoinedGame(true);
    }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [borderless, typedAll]);
  useEffect(() => {
    if (!borderless) return;
    if (reducedMotion) {
      setTyped(HEADING_LENGTH);
      return;
    }
    const timer = window.setInterval(() => {
      setTyped((n) => {
        if (n + 1 >= HEADING_LENGTH) window.clearInterval(timer);
        return n + 1;
      });
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [borderless, reducedMotion]);
  useEffect(() => {
    if (borderless) return;
    const t = window.setTimeout(
      () => setRobuJoinedGame(true),
      JOIN_GAME_DELAY_MS,
    );
    return () => window.clearTimeout(t);
  }, [borderless]);

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
    stepMs,
  });

  useEffect(() => {
    if (!hintRef) return;
    hintRef.current = locked || isPlaying ? null : fillHint;
    return () => {
      hintRef.current = null;
    };
  }, [hintRef, locked, isPlaying, fillHint]);

  // The same condition as the MOVES bar's own Play button.
  const canRun = !locked && !isPlaying && success === null && commands.some((c) => c !== null);
  useEffect(() => {
    if (!playRef) return;
    playRef.current = canRun ? runSequence : null;
    return () => {
      playRef.current = null;
    };
  }, [playRef, canRun, runSequence]);
  useEffect(() => {
    onRunStateChange?.({ canRun, running: isPlaying });
  }, [onRunStateChange, canRun, isPlaying]);

  useEffect(() => {
    if (!resetRef) return;
    resetRef.current = resetLevel;
    return () => {
      resetRef.current = null;
    };
  }, [resetRef, resetLevel]);
  useEffect(() => {
    onResultChange?.({ success, failureMsg });
  }, [onResultChange, success, failureMsg]);

  // Latch: once solved, stay solved so "Continue" stays available even after a reset.
  useEffect(() => {
    if (success === true) onSolvedChange(true);
  }, [success, onSolvedChange]);

  // Same latch for "a run has ended", right or wrong.
  useEffect(() => {
    if (success !== null) onFinishedChange?.(true);
  }, [success, onFinishedChange]);

  return (
    // Level 1 (`borderless`) stays the phone column's width: the intro's desktop
    // widths would let its full-stage rows stretch it and push it off centre.
    <div className={`flex flex-col gap-3 ${borderless ? "min-h-full w-full flex-1" : "md:mx-auto md:max-w-xl lg:max-w-4xl md:min-h-full md:justify-center"}`}>
      {/* ── Header — Robu stands here for the first beat (same arrival every
          other screen gets), then leaves for the board once he joins the
          game; his icon un-reserves that space the instant he does, so the
          bubble/description expand to the full row on their own — nothing
          else here needs to change to make room. ── */}
      {borderless && (
        // Phone width at most: Hex's slot is a share of this row, so on a wide
        // desktop he would otherwise outgrow the screen.
        <div className="relative top-3 left-1/2 flex h-[74px] w-[calc(min(var(--stage-w),560px)-50px)] shrink-0 -translate-x-1/2 items-start">
          {/* The heading sits over Hex's box (it's above him). Hex stands beside it, so
            it stays at the left; its top is where every other screen's title starts
            (79px down the stage: this row is at 84). */}
          <h1 className="relative z-30 -mt-[5px] w-[72%] min-w-0 text-[28px] leading-[134%] font-semibold text-[#2C2C2C] dark:text-white">
            {HEADING_WORDS.map((word, w) => (
              <span key={w}>
                {w > 0 && " "}
                <span className="inline-block whitespace-nowrap">
                  {word.map(({ char, accent, index }) => (
                    // Typed in one letter at a time; hidden letters keep their
                    // room, so nothing moves while typing.
                    <span
                      key={index}
                      className={`inline-block ${accent ? "text-[#04ACAB]" : ""} ${index < typed ? "opacity-100" : "opacity-0"}`}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h1>
          {/* Hex stands here until Start. His box is big, but the negative
            margins make it take little room, so he overlaps what's around
            him. */}
          {/* Placed from the row's top and right edge, all in ratios of the
            screen, so he sits in the same spot on every device. */}
          {robuJoinedGame ? (
            <div aria-hidden className={HEX_SLOT_CLASS} />
          ) : (
            <RobuAnchor registerAnchor={registerAnchor} className={HEX_SLOT_CLASS} />
          )}
        </div>
      )}
      {!borderless && (
      <div className="flex-col items-center justify-center gap-3 md:justify-start">
        <motion.div
          layout
          className="flex w-full items-start justify-center"
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
            className={`min-w-0 ${ROBU_TRAILING_GAP_PULL}`}
          >
            <SpeechBubble
              text={`${slide.highlightWord} ${slide.title}`}
              highlight={slide.highlightWord}
              instant={instantSpeech}
              size="heading"
            />
          </motion.div>
        </motion.div>
        <div className="text-center md:text-left">
          {/* Same "heading" treatment (no bubble chrome) every other
              current-branch screen's title uses — paired with Robu's own
              icon for a moment before he leaves for the board, so it still
              reads as him saying it rather than a bare page title. */}

          {slide.description && (
            <p className="mt-2 text-sm font-medium leading-[1.4] text-[#666666] dark:text-neutral-400">
              {slide.description}
            </p>
          )}
        </div>
      </div>
      )}

      {/* Board on the left, controls on the right (stacked on small screens). */}
      {/* Level 1 (`borderless`) keeps its phone layout on every screen: the
        side-by-side desktop columns are only for the intro's own game. */}
      <div className={`flex flex-col ${borderless ? "flex-1 gap-0" : "gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-6"}`}>
        {/* ── Left column — the game board ── */}
        <div className={`relative ${borderless ? "left-1/2 -mt-4 mb-3 w-(--stage-w) -translate-x-1/2" : "lg:order-1 lg:w-105 lg:shrink-0"}`}>
          <div
            inert={locked}
            className={`transition-[filter] duration-[1400ms] ease-in-out ${locked ? "pointer-events-none grayscale select-none" : "grayscale-0"}`}
          >
          {/* Level 1: the platform, with everything on it (Hex follows, he is
            measured every frame), drifts up and down a few px (9). */}
          <motion.div
            animate={borderless && !reducedMotion ? { y: [0, -9, 0] } : undefined}
            transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
          >
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
            borderless={borderless}
          />
          </motion.div>
          </div>
        </div>

        {/* ── Right column — program slots, actions and run controls ── */}
        <div
          inert={locked}
          className={`flex flex-col ${borderless ? "relative top-3 left-1/2 z-[4] mt-auto w-[min(var(--stage-w),560px)] max-w-none -translate-x-1/2 items-center rounded-t-[38px] pt-1 bg-white dark:bg-background" : "gap-3 lg:order-2 lg:w-100 lg:shrink-0"} transition-[filter] duration-[1400ms] ease-in-out ${locked ? "pointer-events-none grayscale select-none" : "grayscale-0"}`}
        >
          {borderless && (
            <div className="flex h-11 w-full items-center justify-center gap-1.5 rounded-t-[38px] bg-white px-3 dark:bg-white/6">
              <Move className="h-[22px] w-[22px] text-[#B286FD]" strokeWidth={2} />
              {/* The stage is scaled to fit the device; dividing by that scale draws a true 12px on screen. */}
              <span
                className="font-medium text-[#2C2C2C] dark:text-white"
                style={{ fontSize: "calc(12px / var(--stage-scale, 1))", lineHeight: "calc(18px / var(--stage-scale, 1))" }}
              >
                Tap any option to preview Hex’s movement.
              </span>
            </div>
          )}
          {borderless && (
            <MovesBar
              commands={commands}
              isPlaying={isPlaying}
              success={success}
              executingStep={executingStep}
              removeCommand={removeCommand}
              resetLevel={resetLevel}
              triggerSound={triggerSound}
            />
          )}

          {!borderless && (
            <ProgramSlots
              commands={commands}
              isPlaying={isPlaying}
              success={success}
              executingStep={executingStep}
              removeCommand={removeCommand}
            />
          )}

          <div className={borderless ? "w-full px-[25px]" : "contents"}>
            <CommandPalette
              level={LEVEL}
              isPlaying={isPlaying}
              success={success}
              addCommand={addCommand}
              borderless={borderless}
            />
          </div>

          {!borderless && (
          <GameFooter
            isPlaying={isPlaying}
            success={success}
            commands={commands}
            runSequence={runSequence}
            resetLevel={resetLevel}
            triggerSound={triggerSound}
          />
          )}
        </div>
      </div>

      {/* ── Inline result banner (no CompletionModal in the intro flow). Only
          for a miss: a win is celebrated by the gem popup (Level 1). ── */}
      {success === false && !borderless && (
        <motion.div
          // Level 1: a sheet that slides up from the bottom, over whatever is
          // in the way, parked above Continue so nothing is scrolled out of view.
          className={
            borderless
              ? "fixed inset-x-4 bottom-34 z-40 mx-auto flex max-w-[358px] items-start gap-2.5 rounded-lg bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)] dark:bg-[#1E2028]"
              : "w-full rounded-[8px] p-3.5 flex items-start gap-2.5 animate-pop-in"
          }
          initial={borderless ? { y: 220, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(225,29,72,0.16) 0%, rgba(255,255,255,0) 98.7%)",
          }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-rose-600 dark:bg-rose-500">
            <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight text-rose-600 dark:text-rose-400">Not quite yet.</h3>
            <p className="text-xs font-medium leading-[1.4] mt-0.5 text-rose-600 dark:text-rose-400">
              {failureMsg} Tap Reset and try again.
            </p>
          </div>
        </motion.div>
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
