import { Box, Hand, Scan, type LucideIcon } from "lucide-react";
import { moduleHref } from "@/lib/routes";

/** Screens in Module 2 (the progress bar's total). */
export const LEVEL_TWO_STEPS = 3;

/** Module 2's `step`th screen, or its "Lesson complete!". */
export const levelTwoHref = (step: number | "complete") => moduleHref(2, step);

/** The robot-arm picture (the arm, its table and the target box; the cube is
 * drawn over it so it can move) and its size in px. */
export const SCENE_SRC = "/images/level-two/robot-arm-bg.webp";
export const SCENE_W = 1560;
export const SCENE_H = 2383;

/** Picture px -> % of the picture. */
const px = (x: number, y: number) => ({ left: `${(x / SCENE_W) * 100}%`, top: `${(y / SCENE_H) * 100}%` });

/** The cube's top-left corner in each of its spots (picture px). */
export const CUBE_AT = {
  table: px(448, 1643),
  held: px(507, 1407),
  overTarget: px(994, 1407),
  target: px(994, 1587),
} as const;
export const CUBE_SIZE = { width: `${(240 / SCENE_W) * 100}%`, height: `${(222 / SCENE_H) * 100}%` };

export type CubeSpot = keyof typeof CUBE_AT;

/** Each leg of the cube's trip. */
export const LEG_S = 0.55;
/** The result card follows once the cube has settled. */
export const RESULT_AFTER_S = 0.25;

export type Command = { label: string; icon: LucideIcon; iconClass: string };

type Round = {
  /** What Hex says. */
  line: string;
  command: Command;
  /** Where the cube is at the start, and the spots it moves through once the
   * command is given (the last is where it stays). */
  from: CubeSpot;
  moves: readonly CubeSpot[];
  /** The result card's sentence. */
  result: string;
};

export const ROUNDS: readonly Round[] = [
  {
    line: "The robot can pick up objects. Let's give it the instruction.",
    command: { label: "Pick Up", icon: Box, iconClass: "fill-[#1F6BFF] text-[#0B4FD6]" },
    from: "table",
    moves: ["held"],
    result: "You gave an instruction. The robot picked up the cube.",
  },
  {
    line: "The robot is holding the cube. Which instruction will make it release the cube right?",
    command: { label: "Put Down", icon: Hand, iconClass: "fill-[#FFC79A] text-[#F08A3E]" },
    from: "held",
    moves: ["table"],
    result: "You gave a different instruction. The robot put the cube down on the table.",
  },
  {
    line: "Let's move the cube to target area. Which instruction will do this?",
    command: { label: "Place in Target", icon: Scan, iconClass: "text-[#04ACAB]" },
    from: "table",
    moves: ["held", "overTarget", "target"],
    result: "You gave an instruction with a destination. The robot moved the cube to the target area and placed it there.",
  },
];
