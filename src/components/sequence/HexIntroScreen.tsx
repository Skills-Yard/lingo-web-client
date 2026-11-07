"use client";

import { useRouter } from "next/navigation";
import { Teal } from "@/components/level-two/LevelTwoShell";
import { HexBoard } from "./HexBoard";
import { HexScreen } from "./HexScreen";
import { ROW_START } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";

/** "Let's help HEX reach the energy!": Hex at the left of a straight row, the battery three tiles on; "Let's Try" starts it. */
export function HexIntroScreen() {
  const router = useRouter();
  return (
    <HexScreen
      step={STEP.hexIntro}
      title={
        <>
          Help <Teal>HEX</Teal> reach the battery!
        </>
      }
      titleSize={24}
      board={<HexBoard kind="row" hex={ROW_START} battery={{ col: 3, row: 0 }} width={356} entryKey="hex-intro" />}
      boardTop={200}
      tip="HEX needs energy! Give it instructions to reach the battery."
      tipTop={340}
      ctaLabel="Let’s Try"
      onContinue={() => router.push(sequenceNext(STEP.hexIntro))}
    />
  );
}
