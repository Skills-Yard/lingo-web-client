"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "./HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/** Figma: Hex's line starts 182px down the frame. */
const DIALOGUE_TOP = 182;
const BUBBLE = { width: 167 };

/**
 * `/module?step=7` — "Move cube to target": the robot
 * holds the cube, and the target box is lit up with its label.
 */
export function TargetScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={7} scene={<RobotBackdrop below={robotBelowDialogue(DIALOGUE_TOP, BUBBLE)} pose="holding" hint targetLabel="TARGET AREA" />} ctaLabel="Continue" onContinue={() => router.push(levelTwoHref(8))}>
      <ScreenTitle>
        Move cube <Teal>to target</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(DIALOGUE_TOP)}>
        <HexBubble entryKey="target" hex="left" size={BUBBLE} line={[{ text: "The robot is holding the cube." }]} />
      </CentredRow>
    </LevelTwoShell>
  );
}
