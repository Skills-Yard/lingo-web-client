"use client";

import { useEffect } from "react";
import { fireRobot, setRobotTargetLabel, syncRobotPose, type RobotPose } from "@/lib/rive/robotHost";
import { COMMAND_ROBOT } from "@/lib/rive/runtime";
import { HEX_SLOT } from "./HexBubble";
import type { BubbleSize } from "./levelTwo";
import { aboveButtons, stageTop } from "./LevelTwoShell";
import { PersistentRobot, robotPx } from "./PersistentRobot";

/** The gap between the robot's bottom edge and the first control under it. */
export const ROBOT_GAP = 12;

/** The top bar is 8px down the stage and 44px tall; the picture shows from the gap below it. */
const TOP_BAR_BOTTOM = 52;
export const ROBOT_TOP_GAP = 8;
/** The picture is cut at this stage `top`: under the top bar and the gap below it. */
const CLIP_TOP = TOP_BAR_BOTTOM + ROBOT_TOP_GAP;
/**
 * The lowest the picture goes, from the Figma: its 120th px (the room's wall
 * above that is not drawn there) starts 96px down a 390px-wide stage, 44px
 * under the top bar. It scales with the picture's width, and a screen whose
 * first control is higher than this lifts the picture clear of it.
 */
const FIGMA_PICTURE_TOP = 96;
const FIGMA_CROP_TOP = 120;
/** Where the picture meets the top bar's edge it fades in over this many px instead of ending in a hard line. */
const TOP_EDGE_FADE = 40;
const TOP_EDGE_MASK = `linear-gradient(180deg, transparent 0, #000 ${TOP_EDGE_FADE}px)`;

/**
 * Where the picture's bottom edge stands (a CSS length up from the stage's
 * bottom): the artboard's own bottom edge rests on `restsOn`, so the faded floor
 * drawn below the artboard goes behind whatever is there, but the picture is
 * never lower than the Figma has it.
 */
const pictureBottom = (restsOn: string) => {
  const figma = `calc(var(--stage-h, 844px) - ${FIGMA_PICTURE_TOP}px - ${robotPx(COMMAND_ROBOT.overflowTop + COMMAND_ROBOT.height + COMMAND_ROBOT.overflowBottom - FIGMA_CROP_TOP)})`;
  return `max(0px, ${figma}, calc(${restsOn} - ${robotPx(COMMAND_ROBOT.overflowBottom)}))`;
};

/**
 * A CSS `bottom` that rests the robot `ROBOT_GAP` above a stack of `stack` px
 * that itself stands `aboveButtons`-style on the button row (the answer cards,
 * a line of text). `stack` 0 rests it on the button row alone.
 */
export const robotAbove = (stack: number, withHint = false) => aboveButtons(stack + ROBOT_GAP, withHint);

/** The same for a control placed from the top of the stage: `top` is its Figma-style stage `top`. */
export const robotAboveTop = (top: number) => `calc(var(--stage-h, 844px) - ${top - ROBOT_GAP}px)`;

/** The gap between the bottom of Hex's bubble and the top of the arm under it. */
const ROBOT_BELOW_GAP = 0;
/** A bubble's height (px) when its text takes the three lines it does in the designs, and the drop edge under it. */
const BUBBLE_HEIGHT = { short: 80, tall: 86 } as const;
const BUBBLE_EDGE = 3;

/**
 * The stage `top` the arm starts at when it hangs from Hex's bubble, whose row
 * starts at the Figma `top` `bubbleTop`: right under the bubble's bottom edge.
 * The empty wall above the arm then runs up behind the bubble and the title.
 */
export const robotBelowDialogue = (bubbleTop: number, bubble: BubbleSize) => {
  const height = bubble.minHeight ?? (bubble.short ? BUBBLE_HEIGHT.short : BUBBLE_HEIGHT.tall);
  // The bubble is centred on Hex's row.
  return stageTop(bubbleTop) + (HEX_SLOT + height) / 2 + BUBBLE_EDGE + ROBOT_BELOW_GAP;
};

type RobotBackdropProps = {
  /** Where the cube is when the screen opens; the robot gets there from wherever the last screen left it. */
  pose: RobotPose;
  /** Lights up the target box while true. */
  hint?: boolean;
  /** The text on the target box. */
  targetLabel?: string;
} & (
  | {
      /** The CSS `bottom` the artboard's bottom edge rests on, on the stage (see `robotAbove`). */
      bottom: string;
      below?: never;
    }
  | {
      /** The stage `top` the arm's top starts at, under Hex's bubble (see `robotBelowDialogue`). */
      below: number;
      bottom?: never;
    }
);

/**
 * The picture behind a module screen: the one robot arm of `command.riv`, at
 * the screen's full width. Either its bottom edge rests above the first control
 * on the screen (`bottom`), drawn at its full size from there up, behind the
 * title and Hex's line; or, where Hex's line is at the top, it starts under that
 * bubble (`below`). Either way it is cut only by the top bar and a gap below it,
 * and the controls below it (answer cards, the button row) may cover its bottom.
 */
export function RobotBackdrop({ bottom, below, pose, hint = false, targetLabel }: RobotBackdropProps) {
  useEffect(() => {
    syncRobotPose(pose);
  }, [pose]);

  useEffect(() => {
    if (targetLabel !== undefined) setRobotTargetLabel(targetLabel);
  }, [targetLabel]);

  useEffect(() => {
    if (!hint) return;
    fireRobot("showHint");
    return () => fireRobot("hideHint");
  }, [hint]);

  // Under Hex's bubble the picture hangs from it, the arm right under the bubble
  // (the empty wall above runs up, behind the title); otherwise it stands on the
  // first control.
  const hanging = below !== undefined;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 -z-10 flex flex-col items-center overflow-hidden ${hanging ? "justify-start" : "justify-end"}`}
      style={{
        top: CLIP_TOP,
        bottom: 0,
        paddingBottom: hanging ? undefined : pictureBottom(bottom),
        maskImage: TOP_EDGE_MASK,
        WebkitMaskImage: TOP_EDGE_MASK,
      }}
    >
      <div style={hanging ? { marginTop: `calc(${below - CLIP_TOP}px - ${robotPx(COMMAND_ROBOT.overflowTop + COMMAND_ROBOT.armTop)})` } : undefined}>
        <PersistentRobot />
      </div>
    </div>
  );
}
