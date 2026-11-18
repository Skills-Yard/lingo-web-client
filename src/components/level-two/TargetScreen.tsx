"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { COMMAND_ROBOT } from "@/lib/rive/runtime";
import { HexBubble } from "./HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { robotPx } from "./PersistentRobot";
import { RobotBackdrop, robotBelowDialogue } from "./RobotBackdrop";
import { levelTwoHref, type Span } from "./levelTwo";

/** Figma: Hex's line starts 182px down the frame. */
const DIALOGUE_TOP = 182;
const BUBBLE = { width: 167 };
/** Hex's row stands this far above the button when he is at the bottom (as on the "Let's make it happen!" screen). */
const BOTTOM_ABOVE_BUTTONS = 118;

/** The stage `top` the arm starts at, under Hex's first bubble. */
const ARM_TOP = robotBelowDialogue(DIALOGUE_TOP, BUBBLE);
/** The artboard's bottom edge on the stage (a CSS length): the arm's top is `armTop` down the artboard. */
const ARTBOARD_BOTTOM = `calc(${ARM_TOP}px + ${robotPx(COMMAND_ROBOT.height - COMMAND_ROBOT.armTop)})`;
/** At the artboard's bottom his row's lower edge is this far below the artboard's (px), which keeps
 * his bubble just under the target box and its label, so it never covers what the line points at. */
const ROW_BELOW_ARTBOARD = 69;

/** Where Hex's row stands: from the top of the stage, or up from its bottom (CSS lengths). */
type Place = { top: number } | { bottom: string };

/** Hex's three places: above the arm, at the bottom of the artboard, then above the button. */
const PLACES = {
  aboveArm: { top: stageTop(DIALOGUE_TOP) },
  artboardBottom: { bottom: `calc(var(--stage-h, 844px) - ${ARTBOARD_BOTTOM} - ${ROW_BELOW_ARTBOARD}px)` },
  aboveButton: { bottom: aboveButtons(BOTTOM_ABOVE_BUTTONS) },
} satisfies Record<string, Place>;

/** What Hex says and where he stands, in order: each Continue brings the next, and the robot plays along. */
const LINES: readonly { text: readonly Span[]; place: Place }[] = [
  { text: [{ text: "The robot is holding the cube." }], place: PLACES.aboveArm },
  { text: [{ text: "The target area is marked on the table." }], place: PLACES.artboardBottom },
  { text: [{ text: "Let’s move the cube in the target area!" }], place: PLACES.aboveButton },
];

/** The line where the target box lights up (it stays lit to the end). */
const TARGET_LINE = 1;
/** Hex and his bubble take this long to leave (see `HexBubble`) before the next line comes in at its place. */
const HEX_LEAVE_MS = 350;

/**
 * `/module/commands?step=7` — "Move cube to target": Hex says three lines, one per
 * Continue, each from a different place, and the robot behind him follows
 * them: it holds the cube, then the target box is lit up with its label, which
 * stays lit for the last line.
 */
export function TargetScreen() {
  const router = useRouter();
  const [line, setLine] = useState(0);
  // Hex is on his way out of the line he said, to come in at the next one's place.
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      setLine((current) => current + 1);
      setLeaving(false);
    }, HEX_LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  const lastLine = line === LINES.length - 1;
  const targetLit = line >= TARGET_LINE;
  return (
    <LevelTwoShell
      step={7}
      voiceover={MODULE_AUDIO.target[line]}
      scene={
        <RobotBackdrop
          below={ARM_TOP}
          pose="holding"
          hint={targetLit}
          targetLabel={targetLit ? "TARGET AREA" : undefined}
        />
      }
      ctaLabel="Continue"
      ctaLocked={leaving}
      onContinue={() => (lastLine ? router.push(levelTwoHref(8)) : setLeaving(true))}
    >
      <ScreenTitle>
        Move cube <Teal>to target</Teal>
      </ScreenTitle>
      <CentredRow {...LINES[line].place}>
        <HexBubble key={line} entryKey={`target-${line}`} hex="left" size={BUBBLE} line={LINES[line].text} leaving={leaving} />
      </CentredRow>
    </LevelTwoShell>
  );
}
