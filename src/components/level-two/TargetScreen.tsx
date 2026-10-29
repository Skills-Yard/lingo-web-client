"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "./HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { levelTwoHref } from "./levelTwo";

/**
 * `/module?step=7` — "Move the cube in the target area.": the robot
 * holds the cube, and the target box is lit up with its label.
 */
export function TargetScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={7} scene={<RobotScene from="held" target />} ctaLabel="Continue" onContinue={() => router.push(levelTwoHref(8))}>
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
