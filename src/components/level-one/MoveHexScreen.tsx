"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INSTRUCTIONS_INTRO_SLIDES,
  type GameSlide,
} from "@/lib/constants/instructionsIntro";
import { GameBoardScreen } from "@/components/instructions-intro/GameBoardScreen";
import { HexStage } from "./HexStage";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";

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

  if (!GAME_SLIDE) return null;

  return (
    <LevelOneShell
      step={8}
      flush
      fit
      ctaDisabled={!finished}
      onBack={() => router.push(levelOneHref(7))}
      onContinue={() => router.push("/level")}
    >
      {/* Hex is positioned against this box, so it must wrap the
        screen he walks around in. */}
      <div ref={stageRef} className="relative mt-[calc(var(--stage-h)*0.045)] flex w-full flex-1 flex-col">
        <HexStage anchorEl={anchorEl} containerRef={stageRef} />
        <GameBoardScreen
          slide={GAME_SLIDE}
          onSolvedChange={() => {}}
          onFinishedChange={setFinished}
          registerAnchor={setAnchorEl}
          borderless
          stepMs={STEP_MS}
        />
      </div>
    </LevelOneShell>
  );
}
