"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, Teal } from "@/components/level-two/LevelTwoShell";
import { HEX_ROW_TOP, TrekBackdrop } from "./scenes";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";

/** "Let's go trekking today!": Hex tells what is about to happen over a picture of the trail. */
export function TrekScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={STEP.trek}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.trek))}
      scene={<TrekBackdrop />}
      onContinue={() => router.push(variableNext(STEP.trek))}
    >
      <ScreenTitle oneLine>
        Let’s go <Teal>trekking</Teal> today!
      </ScreenTitle>
      <CentredRow top={HEX_ROW_TOP}>
        <HexBubble entryKey="trek" hex="left" line={[{ text: "You and your friends are off on a trek!" }]} size={{ width: 190 }} />
      </CentredRow>
    </LevelTwoShell>
  );
}
