"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "./HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotBackdrop, robotAbove } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/**
 * `/module?step=7` — "Move the cube in the target area.": the robot
 * holds the cube, and the target box is lit up with its label.
 */
export function TargetScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={7} scene={<RobotBackdrop bottom={robotAbove(0)} pose="holding" hint targetLabel="TARGET AREA" />} ctaLabel="Continue" onContinue={() => router.push(levelTwoHref(8))}>
      <ScreenTitle>
        Move the cube in the
        <br />
        <Teal>target area.</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(182)}>
        <HexBubble entryKey="target" hex="left" size={{ width: 167 }} line={[{ text: "The robot is holding the cube." }]} />
      </CentredRow>
    </LevelTwoShell>
  );
}
