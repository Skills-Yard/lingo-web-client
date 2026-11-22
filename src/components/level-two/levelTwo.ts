import { COLUMN_W } from "@/lib/questionColumn";
import type { RobotMove, RobotPose } from "@/lib/rive/robotHost";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { commandsHref } from "@/lib/routes";

/** The module's `step`th screen, or its "Lesson complete!". */
export const levelTwoHref = (step: number | "complete") => commandsHref(step);

/** The Figma frame is 390 x 844 with its own status bar; the Level 1 shell's
 * header sits this much higher, so everything pinned to the top (title, Hex's
 * row, the picture) is moved up by it, and what is pinned to the bottom isn't. */
export const FRAME_TOP_SHIFT = 37;

/** A CSS `left` that centres the question's and the answers' column (see `questionColumn`) on the stage. */
export const COLUMN_LEFT = `calc(50% - ${COLUMN_W} / 2)`;

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
export type Choice = {
  id: string;
  text: string;
  icon: string;
  tint?: string;
  /** A short text in a coloured badge (its `look` is the fill and text classes), drawn in place of the picture. */
  tag?: { text: string; look: string };
  moves?: readonly RobotMove[];
};

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
  /** The panel's title, where it isn't the default ("Correct!" / "Not quite"). */
  rightTitle?: string;
  wrongTitle?: string;
  /** Where the cube is when the screen opens (the robot carries on from the previous screen). */
  pose: RobotPose;
  /** The cards stay in view on a right answer, though the robot plays a move (they fade out otherwise). */
  keepCards?: boolean;
  /** The target box is lit from the start, with this text on it (as on the "Move cube to target" screen). */
  targetLabel?: string;
  /** The main button before the answer is checked (default "Check"). */
  ctaLabel?: string;
  /** Clips read when the screen opens (the title, then Hex's line); cut off once the answer is checked. */
  voiceover?: readonly string[];
};

const LAVENDER = "bg-[#F6F4FE] dark:bg-[#0F1F26]";
const CREAM = "bg-[#FFF9F0] dark:bg-[#0F1F26]";

/** Screen 3 — `/module/commands?step=3`. */
export const WHAT_JUST_HAPPENED: Quiz = {
  title: [[{ text: "What just " }, { text: "happened?", teal: true }]],
  line: [{ text: "What did the robot do after " }, { text: "Pick Up", teal: true }, { text: "?" }],
  bubble: { width: 178, short: true },
  bubbleTop: 172,
  layout: "list",
  choices: [
    // The right answer shows it again: the cube goes back, and is picked up.
    { id: "picked", text: "Robot picked up the cube.", icon: "step-4.1.svg", moves: ["reset", "pickUp"] },
    { id: "table", text: "Robot moved the table.", icon: "step-4.2.svg", moves: ["wrongCube"] },
    { id: "nothing", text: "Nothing happened.", icon: "step-4.3.svg", moves: ["wrongClaw"] },
  ],
  correctId: "picked",
  rightTitle: "Exactly!",
  right: "The robot followed the instructions and picked up the cube.",
  wrongTitle: "Let’s look again!",
  wrong: "Watch what robot does after you select the instruction.",
  pose: "holding",
  keepCards: true,
  voiceover: MODULE_AUDIO.whatJustHappened,
};

/** Screen 5 — `/module/commands?step=5`. */
export const WHAT_NEXT: Quiz = {
  title: [[{ text: "It’s " }, { text: "your turn", teal: true }, { text: " now!" }]],
  line: [{ text: "Let’s make the robot pick up the cube." }],
  bubble: { width: 244 },
  bubbleTop: 172,
  layout: "list",
  choices: [
    { id: "pickup", text: "Pick Up the Cube", icon: "step-10.1.svg", moves: ["pickUp"] },
    { id: "move", text: "MOVE to the table", icon: "step-10.2.svg", moves: ["wrongClaw"] },
    { id: "place", text: "Place the cube", icon: "step-10.3.svg", moves: ["wrongCube"] },
  ],
  correctId: "pickup",
  rightTitle: "Nice!",
  right: "You told the robot to pick up the cube.",
  wrongTitle: "Let’s look again!",
  wrong: "Which command lifts the cube?",
  pose: "idle",
  voiceover: MODULE_AUDIO.yourTurn,
};

/** Screen 4 — `/module/commands?step=4`. */
export const ROBOT_PICKED_UP: Quiz = {
  title: [[{ text: "Let’s " }, { text: "release", teal: true }, { text: " the cube." }]],
  line: [{ text: "Which command releases the cube?" }],
  bubble: { width: 232 },
  bubbleTop: 162,
  layout: "pair",
  choices: [
    { id: "pickup", text: "Pick Up", icon: "step-9.1.svg", tint: LAVENDER, moves: ["wrongClaw"] },
    { id: "putdown", text: "Put Down", icon: "step-9.2.svg", tint: CREAM, moves: ["putDown"] },
  ],
  correctId: "putdown",
  rightTitle: "Exactly!",
  right: "The robot followed a different instruction and performed a different action.",
  wrongTitle: "Not quite!",
  wrong: "Robot is not releasing it, it will grab it.",
  pose: "holding",
  voiceover: MODULE_AUDIO.releaseCube,
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
};

/** Screen 8 — `/module/commands?step=8`. */
export const WHERE_SHOULD_GO: Quiz = {
  title: [[{ text: "How to " }, { text: "reach the target?", teal: true }]],
  line: [{ text: "Pick an instruction to reach the target area." }],
  bubble: { width: 232 },
  bubbleTop: 176,
  layout: "tiles",
  choices: [
    { id: "pickup", text: "Pick Up", icon: "step-13.1.svg", tint: "bg-[#ECF7ED] dark:bg-[#10261A]", moves: ["wrongClaw"] },
    { id: "putdown", text: "Put Down", icon: "step-13.2.svg", tint: "bg-[#FFF3DE] dark:bg-[#2A2218]", moves: ["wrongCube"] },
    { id: "target", text: "Place in Target", icon: "step-13.3.svg", tint: "bg-[#E5EFFD] dark:bg-[#15233A]", moves: ["placeInTarget"] },
  ],
  correctId: "target",
  targetLabel: "TARGET AREA",
  rightTitle: "Exactly!",
  right: "Place in Target moves the cube to the target area.",
  wrong: "Remember: Place in Target moves the cube to the target area.",
  pose: "holding",
  voiceover: MODULE_AUDIO.reachTarget,
};

/** Screen 18 — `/module/commands?step=18`. */
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
};
