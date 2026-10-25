"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INSTRUCTIONS_INTRO_SLIDES,
  type GameSlide,
} from "@/lib/constants/instructionsIntro";
import { GameBoardScreen } from "@/components/instructions-intro/GameBoardScreen";
import { FeedbackPanel } from "./FeedbackPanel";
import { GemPopup } from "./GemPopup";
import { HexStage } from "./HexStage";
import { LevelOneShell, levelOneCompleteHref, levelOneHref } from "./LevelOneShell";

/** Time per command — quicker than the old intro's 700ms. */
const STEP_MS = 400;

const GAME_SLIDE = INSTRUCTIONS_INTRO_SLIDES.find(
  (slide): slide is GameSlide => slide.kind === "game",
);

/**
 * `/module?level=1&step=8` — the game board screen from the instructions intro, as it
 * was: the same board, program slots, actions and Run/Reset controls, with
 * Hex (HexStage) walking the grid as the player piece.
 * Finishing a run (right or wrong) unlocks Continue.
 */
export function MoveHexScreen() {
  const router = useRouter();
  // Continue unlocks once a run has ended, whether it reached the flag or not.
  const [finished, setFinished] = useState(false);
  // Where Hex belongs right now (the board registers its own spot).
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<(() => void) | null>(null);
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

  if (!GAME_SLIDE) return null;

  return (
    <LevelOneShell
      step={8}
      flush
      fit
      backdrop="/images/level-one/game-bg.png"
      // The main button plays the moves Hex was given; once a run has ended it
      // becomes Continue.
      ctaLabel={finished ? "Continue" : "Play"}
      ctaDisabled={finished ? false : !run.canRun}
      hint={{ visible: true, onUse: () => hintRef.current?.() }}
      // The wrong-result panel sits above the program panel (see GameBoardScreen's
      // z-index) and below the Play / Continue row, like on the quizzes; a tap
      // on it takes the moves back so Hex can try again. The gem popup is above all.
      overlay={
        <>
          <div
            className="absolute inset-0 z-[6]"
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
      onBack={() => router.push(levelOneHref(7))}
      onContinue={finished ? () => router.push(levelOneCompleteHref()) : () => playRef.current?.()}
    >
      {/* Hex is positioned against this box, so it must wrap the
        screen he walks around in. */}
      <div ref={stageRef} className="relative mt-5 flex w-full flex-1 flex-col">
        <HexStage anchorEl={anchorEl} containerRef={stageRef} />
        <GameBoardScreen
          slide={GAME_SLIDE}
          onSolvedChange={onSolved}
          onFinishedChange={setFinished}
          registerAnchor={setAnchorEl}
          borderless
          hintRef={hintRef}
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
