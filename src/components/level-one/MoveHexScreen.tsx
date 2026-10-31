"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INSTRUCTIONS_INTRO_SLIDES,
  type GameSlide,
} from "@/lib/constants/instructionsIntro";
import { GameBoardScreen } from "@/components/instructions-intro/GameBoardScreen";
import { FeedbackPanel } from "./FeedbackPanel";
import { GemPopup } from "./GemPopup";
import { HexStage } from "./HexStage";
import { moduleHref } from "@/lib/routes";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
import { LevelOneShell, levelOneHref, levelOneStep } from "./LevelOneShell";

/** Its place in the module. */
const STEP = 16;

/** Time per command — quicker than the old intro's 700ms. */
const STEP_MS = 400;

const GAME_SLIDE = INSTRUCTIONS_INTRO_SLIDES.find(
  (slide): slide is GameSlide => slide.kind === "game",
);

/**
 * `/module?step=16` — the game board screen from the instructions intro, as it
 * was: the same board, program slots, actions and Run/Reset controls, with
 * Hex (HexStage) walking the grid as the player piece.
 * Reaching the flag unlocks Continue; missing it offers Try again.
 */
export function MoveHexScreen() {
  const router = useRouter();
  // Where Hex belongs right now (the board registers its own spot).
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [run, setRun] = useState({ canRun: false, running: false });
  // The gem popup opens once, the moment Hex reaches the flag; closing it
  // (or its 3 second countdown running out) leaves Continue to go on.
  const [gemOpen, setGemOpen] = useState(false);
  const gemShown = useRef(false);
  const onSolved = useCallback(() => {
    if (gemShown.current) return;
    gemShown.current = true;
    setGemOpen(true);
  }, []);
  const closeGem = useCallback(() => setGemOpen(false), []);
  // A run that missed the flag: the quiz's "wrong" result panel slides up
  // (and goes again when the board is reset).
  const [result, setResult] = useState<{ success: boolean | null; failureMsg: string }>({ success: null, failureMsg: "" });
  // A run that missed the flag counts against this question: the first go is what is noted,
  // and Continue (once Hex gets there) asks to be shown it again unless the first run made it.
  const missed = useRef(false);
  useEffect(() => {
    if (result.success !== false) return;
    missed.current = true;
    noteAnswer(STEP, false);
  }, [result.success]);

  if (!GAME_SLIDE) return null;

  // Reaching the flag unlocks Continue; a run that missed it turns the main
  // button into "Try again", which takes the moves back.
  const solved = result.success === true;
  const failed = result.success === false;

  return (
    <LevelOneShell
      step={levelOneStep(8)}
      flush
      fit
      backdrop="/images/level-one/game-bg.png"
      // The main button plays the moves Hex was given; then it is Continue, or
      // Try again after a miss.
      ctaLabel={solved ? "Continue" : failed ? "Try again" : "Play"}
      ctaDisabled={solved || failed ? false : !run.canRun}
      // The wrong-result panel sits above the program panel (see GameBoardScreen's
      // z-index) and below the Play / Continue row, like on the quizzes; a tap
      // on it takes the moves back so Hex can try again. The gem popup is above all.
      overlay={
        <>
          <div
            className="absolute inset-0 z-[9]"
            style={{ pointerEvents: result.success === false ? "auto" : "none" }}
            onClick={() => resetRef.current?.()}
          >
            <FeedbackPanel correct={false} open={result.success === false} hexIn={result.success === false}>
              {result.failureMsg} Tap anywhere on this panel to try again.
            </FeedbackPanel>
          </div>
          <GemPopup open={gemOpen} onClose={closeGem} />
        </>
      }
      onBack={() => router.push(levelOneHref(6))}
      onContinue={() => {
        if (solved) {
          noteAnswer(STEP, !missed.current);
          router.push(nextAfter(STEP, !missed.current, moduleHref("complete")));
        }
        else if (failed) resetRef.current?.();
        else playRef.current?.();
      }}
    >
      {/* Hex is positioned against this box, so it must wrap the
        screen he walks around in. */}
      <div ref={stageRef} className="relative mt-5 flex w-full flex-1 flex-col">
        <HexStage anchorEl={anchorEl} containerRef={stageRef} />
        <GameBoardScreen
          slide={GAME_SLIDE}
          onSolvedChange={onSolved}
          registerAnchor={setAnchorEl}
          borderless
          playRef={playRef}
          onRunStateChange={setRun}
          onResultChange={setResult}
          resetRef={resetRef}
          stepMs={STEP_MS}
        />
      </div>
    </LevelOneShell>
  );
}
