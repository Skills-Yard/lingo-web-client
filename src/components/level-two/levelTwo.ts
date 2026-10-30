import type { RobotMove, RobotPose } from "@/lib/rive/robotHost";
import { moduleHref } from "@/lib/routes";

/** The module's `step`th screen, or its "Lesson complete!". */
export const levelTwoHref = (step: number | "complete") => moduleHref(step);

/** The Figma frame is 390 x 844 with its own status bar; the Level 1 shell's
 * header sits this much higher, so everything pinned to the top (title, Hex's
 * row, the picture) is moved up by it, and what is pinned to the bottom isn't. */
export const FRAME_TOP_SHIFT = 37;

/** A speech bubble's width (px), set by where its text breaks in the designs;
 * `short` is Figma's 77px-tall bubble, `minHeight` any other height (the rest are 86). */
export type BubbleSize = { width: number; short?: boolean; minHeight?: number };

/** A run of text in which some words are picked out (teal). */
export type Span = { text: string; teal?: boolean };

/** A title: one run of spans per line. */
export type TitleLines = readonly (readonly Span[])[];

/**
 * A quiz answer; `icon` is a file in `public/images/level-two/` (drawn once it
 * exists). `moves` is what the robot plays, in order, when this answer is
 * checked — right or wrong; a wrong answer with none plays the claw's.
 */
export type Choice = { id: string; text: string; icon: string; tint?: string; moves?: readonly RobotMove[] };

export type Quiz = {
  title: TitleLines;
  /** The title is underlined (Figma's "Robot has picked it up!"). */
  underline?: boolean;
  /** What Hex says, the bubble it is in, and where his row starts (Figma `top`). */
  line: readonly Span[];
  bubble: BubbleSize;
  bubbleTop: number;
  /** The answers: a list of rows, two big cards, or three small tiles. */
  layout: "list" | "pair" | "tiles";
  /** The cards' text is a sentence, so it is set a little smaller. */
  longText?: boolean;
  choices: readonly Choice[];
  correctId: string;
  /** The result panel's sentence: `right` after a correct pick, `wrong` after a miss. */
  right: string;
  wrong: string;
  /** Where the cube is when the screen opens (the robot carries on from the previous screen). */
  pose: RobotPose;
  /** The cards stay in view on a right answer, though the robot plays a move (they fade out otherwise). */
  keepCards?: boolean;
  /** The hint also lights up the target box. */
  targetHint?: boolean;
  hint: boolean;
  /** The main button before the answer is checked (default "Check"). */
  ctaLabel?: string;
};

const LAVENDER = "bg-[#F6F4FE] dark:bg-[#1B1830]";
const CREAM = "bg-[#FFF9F0] dark:bg-[#2A2218]";

/** Screen 3 — `/module?step=3`. */
export const WHAT_JUST_HAPPENED: Quiz = {
  title: [[{ text: "What just " }, { text: "happened?", teal: true }]],
  line: [{ text: "What happened when you selected PICK UP?" }],
  bubble: { width: 178, short: true },
  bubbleTop: 172,
  layout: "list",
  choices: [
    // The right answer shows it again: the cube goes back, and is picked up.
    { id: "picked", text: "The robot picked up the cube.", icon: "step-4.1.svg", moves: ["reset", "pickUp"] },
    { id: "table", text: "The robot moved the table.", icon: "step-4.2.svg", moves: ["wrongCube"] },
    { id: "nothing", text: "Nothing happened.", icon: "step-4.3.svg", moves: ["wrongClaw"] },
  ],
  correctId: "picked",
  right: "Yes! The robot picked up the cube.",
  wrong: "Remember: When you selected PICK UP, the robot picked up the cube.",
  pose: "holding",
  keepCards: true,
  hint: false,
};

/** Screen 5 — `/module?step=5`. */
export const WHAT_NEXT: Quiz = {
  title: [[{ text: "What will happen " }, { text: "next?", teal: true }]],
  line: [{ text: "The robot has picked up the cube. Now look at the highlighted area." }],
  bubble: { width: 226 },
  bubbleTop: 172,
  layout: "list",
  choices: [
    { id: "place", text: "The robot will place the cube in the targeted area.", icon: "step-5.1.svg", moves: ["placeInTarget"] },
    { id: "higher", text: "The robot will pickup the cube higher.", icon: "step-5.2.svg", moves: ["wrongClaw"] },
    { id: "right", text: "The robot will move the cube to the right.", icon: "step-5.3.svg", moves: ["wrongCube"] },
  ],
  correctId: "place",
  right: "Yes! The robot will place the cube in the targeted area.",
  wrong: "Remember: The robot will place the cube in the targeted area.",
  pose: "holding",
  targetHint: true,
  hint: true,
};

/** Screen 4 — `/module?step=4`. */
export const ROBOT_PICKED_UP: Quiz = {
  title: [[{ text: "Robot " }, { text: "has picked it up!", teal: true }]],
  underline: true,
  line: [{ text: "Now, what if we want the robot to release the cube right here?" }],
  bubble: { width: 200 },
  bubbleTop: 162,
  layout: "pair",
  choices: [
    { id: "pickup", text: "Pick Up", icon: "step-9.1.svg", tint: LAVENDER, moves: ["wrongClaw"] },
    { id: "putdown", text: "Put Down", icon: "step-9.2.svg", tint: CREAM, moves: ["putDown"] },
  ],
  correctId: "putdown",
  right: "Yes! Put Down makes the robot release the cube.",
  wrong: "Remember: Put Down makes the robot release the cube.",
  pose: "holding",
  hint: true,
};

/** Not in the flow now (Level 1's quiz is the 11th). */
export const LETS_PICK_UP: Quiz = {
  title: [
    [{ text: "Let’s make the robot" }],
    [{ text: "pick up", teal: true }, { text: " the cube!" }],
  ],
  line: [{ text: "Your turn now." }],
  bubble: { width: 142, minHeight: 63 },
  bubbleTop: 168,
  layout: "list",
  choices: [
    { id: "pickup", text: "PICK UP the cube", icon: "step-10.1.svg" },
    { id: "move", text: "MOVE to the table", icon: "step-10.2.svg" },
    { id: "place", text: "PLACE the cube", icon: "step-10.3.svg" },
  ],
  correctId: "pickup",
  right: "Yes! PICK UP makes the robot lift the cube.",
  wrong: "Remember: PICK UP makes the robot lift the cube.",
  pose: "idle",
  hint: false,
};

/** Screen 8 — `/module?step=8`. */
export const WHERE_SHOULD_GO: Quiz = {
  title: [
    [{ text: "Where should" }],
    [{ text: "the cube go?", teal: true }],
  ],
  line: [{ text: "Select an instruction to place the cube in the target area." }],
  bubble: { width: 192 },
  bubbleTop: 176,
  layout: "tiles",
  choices: [
    { id: "pickup", text: "Pick Up", icon: "step-13.1.svg", tint: "bg-[#ECF7ED] dark:bg-[#10261A]", moves: ["wrongClaw"] },
    { id: "putdown", text: "Put Down", icon: "step-13.2.svg", tint: "bg-[#FFF3DE] dark:bg-[#2A2218]", moves: ["wrongCube"] },
    { id: "target", text: "Place in Target", icon: "step-13.3.svg", tint: "bg-[#E5EFFD] dark:bg-[#15233A]", moves: ["placeInTarget"] },
  ],
  correctId: "target",
  right: "Yes! Place in Target moves the cube to the target area.",
  wrong: "Remember: Place in Target moves the cube to the target area.",
  pose: "holding",
  hint: false,
  ctaLabel: "Let’s do it!",
};

/** Screen 18 — `/module?step=18`. */
export const WILL_REACH: Quiz = {
  title: [[{ text: "Will it reach " }, { text: "the target?", teal: true }]],
  line: [{ text: "What happens if you choose PUT DOWN?" }],
  bubble: { width: 146 },
  bubbleTop: 150,
  layout: "pair",
  longText: true,
  choices: [
    { id: "here", text: "Cube is released at the robot’s current position.", icon: "step-14.1.svg", tint: LAVENDER },
    { id: "auto", text: "Cube is placed in the target area automatically.", icon: "step-14.2.svg", tint: CREAM },
  ],
  correctId: "here",
  right: "Yes! Put Down releases the cube right where the robot is.",
  wrong: "Remember: Put Down releases the cube at the robot’s current position.",
  pose: "holding",
  hint: true,
};
