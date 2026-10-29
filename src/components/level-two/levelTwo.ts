import { moduleHref } from "@/lib/routes";

/** Screens in Module 2 (the progress bar's total). */
export const LEVEL_TWO_STEPS = 13;

/** Module 2's `step`th screen, or its "Lesson complete!". */
export const levelTwoHref = (step: number | "complete") => moduleHref(2, step);

/** The Figma frame is 390 x 844 with its own status bar; the Level 1 shell's
 * header sits this much higher, so everything pinned to the top (title, Hex's
 * row, the picture) is moved up by it, and what is pinned to the bottom isn't. */
export const FRAME_TOP_SHIFT = 37;

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

/** The dashed target box in the picture (picture px), as % of it. */
export const TARGET_BOX = {
  left: `${(857 / SCENE_W) * 100}%`,
  top: `${(1690 / SCENE_H) * 100}%`,
  width: `${(506 / SCENE_W) * 100}%`,
  height: `${(150 / SCENE_H) * 100}%`,
} as const;

export type CubeSpot = keyof typeof CUBE_AT;

/** Each leg of the cube's trip. */
export const LEG_S = 0.55;

/** A speech bubble's width (px), set by where its text breaks in the designs;
 * `short` is Figma's 77px-tall bubble, `minHeight` any other height (the rest are 86). */
export type BubbleSize = { width: number; short?: boolean; minHeight?: number };

/** A run of text in which some words are picked out (teal). */
export type Span = { text: string; teal?: boolean };

/** A title: one run of spans per line. */
export type TitleLines = readonly (readonly Span[])[];

/** A quiz answer; `icon` is a file in `public/images/level-two/` (drawn once it exists). */
export type Choice = { id: string; text: string; icon: string; tint?: string };

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
  /** Where the cube is (the picture carries on from the previous screen), and
   * where it goes on a right answer. */
  cube: CubeSpot;
  moves?: readonly CubeSpot[];
  hint: boolean;
  /** The main button before the answer is checked (default "Check"). */
  ctaLabel?: string;
};

const LAVENDER = "bg-[#F6F4FE] dark:bg-[#1B1830]";
const CREAM = "bg-[#FFF9F0] dark:bg-[#2A2218]";

/** Screen 3 — `/module?level=2&step=3`. */
export const WHAT_JUST_HAPPENED: Quiz = {
  title: [[{ text: "What just " }, { text: "happened?", teal: true }]],
  line: [{ text: "What happened when you selected PICK UP?" }],
  bubble: { width: 178, short: true },
  bubbleTop: 172,
  layout: "list",
  choices: [
    { id: "picked", text: "The robot picked up the cube.", icon: "step-4.1.svg" },
    { id: "table", text: "The robot moved the table.", icon: "step-4.2.svg" },
    { id: "nothing", text: "Nothing happened.", icon: "step-4.3.svg" },
  ],
  correctId: "picked",
  right: "Yes! The robot picked up the cube.",
  wrong: "Remember: When you selected PICK UP, the robot picked up the cube.",
  cube: "held",
  hint: false,
};

/** Screen 5 — `/module?level=2&step=5`. */
export const WHAT_NEXT: Quiz = {
  title: [[{ text: "What will happen " }, { text: "next?", teal: true }]],
  line: [{ text: "The robot has picked up the cube. Now look at the highlighted area." }],
  bubble: { width: 226 },
  bubbleTop: 172,
  layout: "list",
  choices: [
    { id: "place", text: "The robot will place the cube in the targeted area.", icon: "step-5.1.svg" },
    { id: "higher", text: "The robot will pickup the cube higher.", icon: "step-5.2.svg" },
    { id: "right", text: "The robot will move the cube to the right.", icon: "step-5.3.svg" },
  ],
  correctId: "place",
  right: "Yes! The robot will place the cube in the targeted area.",
  wrong: "Remember: The robot will place the cube in the targeted area.",
  cube: "held",
  hint: true,
};

/** Screen 4 — `/module?level=2&step=4`. */
export const ROBOT_PICKED_UP: Quiz = {
  title: [[{ text: "Robot " }, { text: "has picked it up!", teal: true }]],
  underline: true,
  line: [{ text: "Now, what if we want the robot to release the cube right here?" }],
  bubble: { width: 200 },
  bubbleTop: 162,
  layout: "pair",
  choices: [
    { id: "pickup", text: "Pick Up", icon: "step-9.1.svg", tint: LAVENDER },
    { id: "putdown", text: "Put Down", icon: "step-9.2.svg", tint: CREAM },
  ],
  correctId: "putdown",
  right: "Yes! Put Down makes the robot release the cube.",
  wrong: "Remember: Put Down makes the robot release the cube.",
  cube: "held",
  hint: true,
};

/** Screen 11 — `/module?level=2&step=11`. */
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
  cube: "table",
  hint: false,
};

/** Screen 8 — `/module?level=2&step=8`. */
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
    { id: "pickup", text: "Pick Up", icon: "step-13.1.svg", tint: "bg-[#ECF7ED] dark:bg-[#10261A]" },
    { id: "putdown", text: "Put Down", icon: "step-13.2.svg", tint: "bg-[#FFF3DE] dark:bg-[#2A2218]" },
    { id: "target", text: "Place in Target", icon: "step-13.3.svg", tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
  ],
  correctId: "target",
  right: "Yes! Place in Target moves the cube to the target area.",
  wrong: "Remember: Place in Target moves the cube to the target area.",
  cube: "held",
  moves: ["overTarget", "target"],
  hint: false,
  ctaLabel: "Let’s do it!",
};

/** Screen 13 — `/module?level=2&step=13`. */
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
  cube: "held",
  hint: true,
};
