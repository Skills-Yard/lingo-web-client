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
          Let’s help <Teal>HEX</Teal> reach the energy!
        </>
      }
      titleSize={26}
      wrapTitle
      board={<HexBoard kind="row" hex={ROW_START} battery={{ col: 3, row: 0 }} width={356} entryKey="hex-intro" />}
      boardTop={200}
      tip="HEX needs energy. Help it reach the battery by giving it the right instructions."
      tipTop={340}
      ctaLabel="Let’s Try"
      onContinue={() => router.push(sequenceNext(STEP.hexIntro))}
    />
  );
}
