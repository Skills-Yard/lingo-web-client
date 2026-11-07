"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveArrow, MoveButton } from "@/components/level-one/MoveHexScreen";
import { useBatteryClaim } from "@/components/level-one/useBatteryClaim";
import { Teal } from "@/components/level-two/LevelTwoShell";
import { HexBoard } from "./HexBoard";
import { HexScreen } from "./HexScreen";
import { ROW_START, type HexState } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";
import { claimReward } from "./sequenceScore";

/** The battery is this many tiles from Hex: that many commands reach it. */
const DISTANCE = 3;
/** How long a step takes before the next can be given (ms), and before the battery is taken. */
const STEP_MS = 720;
const BATTERY_TILE = { col: DISTANCE, row: 0 };
/** Pays the battery once per run of the module (what `claimReward` has always keyed it by). */
const REWARD_ID = "sequence-one-command";

const TIPS = [
  "The battery is three tiles away. One move won’t be enough!",
  "HEX moved one tile closer. What should happen next?",
  "One more move and HEX reaches the battery!",
  "HEX reached the battery!",
];

/**
 * "How will HEX reach the battery?": the only command is MOVE FORWARD, and one
 * is not enough: each press walks Hex a tile (the card says how far he has to
 * go) until the third reaches the battery. Taking it opens the "Congratulations!"
 * popup; closing that claims the battery and plays the Battery Doctor.
 */
export function OneCommandScreen() {
  const router = useRouter();
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const pending = useRef<number[]>([]);
  const { win, popup } = useBatteryClaim(REWARD_ID, claimReward);

  useEffect(() => {
    const timers = pending.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const moveForward = () => {
    if (busy || moves >= DISTANCE) return;
    const now = moves + 1;
    setMoves(now);
    setBusy(true);
    pending.current.push(
      window.setTimeout(() => {
        setBusy(false);
        if (now < DISTANCE) return;
        setDone(true);
        win();
      }, STEP_MS),
    );
  };

  const hex: HexState = { col: moves, row: 0, dir: ROW_START.dir };

  return (
    <HexScreen
      step={STEP.oneCommand}
      title={
        <>
          How will <Teal>HEX</Teal> get the battery?
        </>
      }
      titleSize={22}
      board={<HexBoard kind="row" hex={hex} battery={BATTERY_TILE} collected={done} width={356} entryKey="hex-one-command" />}
      boardTop={200}
      tip={TIPS[moves]}
      tipTop={340}
      panel={{ correct: true, title: "Nice!", text: "More than one command was needed.", open: done }}
      celebrate={done}
      overlay={popup}
      ctaDisabled={!done}
      onContinue={() => router.push(sequenceNext(STEP.oneCommand))}
    >
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 440 }}>
        <MoveButton label="Move Forward" look="bg-[#EDFAFE] shadow-[0_4px_0_#BFE6F2]" disabled={busy || moves >= DISTANCE} onPress={moveForward}>
          <MoveArrow id="sequence-forward" from="#74EBF7" to="#0F88E5" stroke="#1F4899" />
        </MoveButton>
      </div>
    </HexScreen>
  );
}
