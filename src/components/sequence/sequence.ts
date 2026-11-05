import type { BubbleSize, Choice, Span, TitleLines } from "@/components/level-two/levelTwo";
import { sequenceHref } from "@/lib/routes";

/** The Sequence module's screens, for its progress bar. */
export const SEQUENCE_STEPS = 7;

/** Its place on the level path. */
export const SEQUENCE_LEVEL = 2;

/** Where the main button goes after screen `step`. */
export const sequenceNext = (step: number) => sequenceHref(step < SEQUENCE_STEPS ? step + 1 : "complete");

/** Where the Back arrow goes from screen `step`. */
export const sequencePrevious = (step: number) => (step > 1 ? sequenceHref(step - 1) : "/level");

const IMAGES = "/images/sequence";
const LAVENDER = "bg-[#F6F4FE] dark:bg-[#0F1F26]";
const CREAM = "bg-[#FFF9F0] dark:bg-[#0F1F26]";
const GETTING_READY_SCENE = `${IMAGES}/getting-ready-scene.webp`;

/** The two moves the rest of the module is about: the same cards on every screen that shows them. */
export const PICK_UP_ICON = "/images/level-two/step-13.1.svg";
export const PLACE_IN_TARGET_ICON = "/images/level-two/step-13.3.svg";

/** A picture beside another, that isn't an answer. */
export type PictureCard = { text: string; icon: string; tint: string };

export type SequenceQuiz = {
  step: number;
  title: TitleLines;
  /** The title is set a little smaller: it would otherwise reach the screen's edges. */
  smallTitle?: boolean;
  /** The title once the answer is checked, where it changes. */
  resultTitle?: TitleLines;
  line: readonly Span[];
  bubble: BubbleSize;
  /** Where Hex's row starts (Figma `top`). */
  bubbleTop: number;
  /** What is behind the screen: an illustration, the robot, or the soft wash. */
  scene: { image: string } | { robot: true } | { plain: true };
  /** Two pictures to compare, above the answers. */
  pictures?: readonly [PictureCard, PictureCard];
  /** The answers: two big cards or a list of rows. */
  layout: "pair" | "list";
  choices: readonly Choice[];
  correctId: string;
  /** The picture box's width, where a card's art is wider than the layout's. */
  pictureWidth?: number;
  /** The picture box's height, where a card's art is larger than the layout's. */
  pictureHeight?: number;
  rightTitle: string;
  right: string;
  wrongTitle: string;
  wrong: string;
  /** The main button before the answer is checked (default "Continue"). */
  ctaLabel?: string;
};

/** Screen 1 — "What to put on first?" */
export const PUT_ON_FIRST: SequenceQuiz = {
  step: 1,
  title: [[{ text: "What to put on " }, { text: "first?", teal: true }]],
  resultTitle: [[{ text: "Let’s try " }, { text: "your order!", teal: true }]],
  line: [{ text: "Let’s get ready before going out." }],
  bubble: { width: 170, short: true },
  bubbleTop: 172,
  scene: { image: GETTING_READY_SCENE },
  layout: "pair",
  pictureWidth: 105,
  choices: [
    { id: "socks", text: "Put on socks", icon: `${IMAGES}/put-on-socks.webp`, tint: LAVENDER },
    { id: "shoes", text: "Put on shoes", icon: `${IMAGES}/put-on-shoes.webp`, tint: CREAM },
  ],
  correctId: "socks",
  rightTitle: "Nice!",
  right: "You are done getting ready.",
  wrongTitle: "Not quite",
  wrong: "Shoes go on after socks. Try putting on your socks first!",
};

/** Screen 2 — "Compare both attempts". */
export const COMPARE_ATTEMPTS: SequenceQuiz = {
  step: 2,
  title: [[{ text: "Compare", teal: true }, { text: " both attempts" }]],
  line: [{ text: "Look closely now!" }],
  bubble: { width: 170, minHeight: 56 },
  bubbleTop: 152,
  scene: { plain: true },
  pictures: [
    { text: "Socks, then shoes", icon: `${IMAGES}/socks-then-shoes.webp`, tint: LAVENDER },
    { text: "Shoes, then socks", icon: `${IMAGES}/shoes-then-socks.webp`, tint: CREAM },
  ],
  layout: "list",
  choices: [
    { id: "actions", text: "The actions themselves", icon: `${IMAGES}/icon-actions.svg` },
    { id: "order", text: "The order of actions", icon: `${IMAGES}/icon-order.svg` },
    { id: "goal", text: "The goal", icon: `${IMAGES}/icon-goal.svg` },
  ],
  correctId: "order",
  rightTitle: "Exactly!",
  right: "The actions were the same, but their order changed the result.",
  wrongTitle: "Not quite",
  wrong: "Both attempts use the same actions and share a goal. Look at what came first.",
};

/** Screen 3 — "What if socks go first?" */
export const SOCKS_FIRST: SequenceQuiz = {
  step: 3,
  title: [[{ text: "What if " }, { text: "socks go first?", teal: true }]],
  line: [{ text: "Let’s get ready again. Your shoes are already on." }],
  bubble: { width: 190 },
  bubbleTop: 150,
  scene: { image: GETTING_READY_SCENE },
  layout: "list",
  choices: [
    { id: "harder", text: "Socks will be harder to put on", icon: `${IMAGES}/put-on-socks.webp` },
    { id: "off", text: "Shoes will come off automatically", icon: `${IMAGES}/put-on-shoes.webp` },
    { id: "same", text: "Order does not matter", icon: `${IMAGES}/icon-repeat.svg` },
  ],
  correctId: "harder",
  rightTitle: "Good thinking!",
  right: "Some actions need to happen before others.",
  wrongTitle: "Not quite",
  wrong: "Doing the steps in the wrong order makes getting ready harder.",
};

/** Screen 4 — "What's the first command?" */
export const FIRST_COMMAND: SequenceQuiz = {
  step: 4,
  title: [[{ text: "What’s the first " }, { text: "command", teal: true }]],
  smallTitle: true,
  line: [{ text: "Move the cube into the target area!" }],
  bubble: { width: 190, short: true },
  bubbleTop: 150,
  scene: { robot: true },
  layout: "pair",
  pictureWidth: 120,
  pictureHeight: 100,
  choices: [
    { id: "pickup", text: "Pick Up", icon: PICK_UP_ICON, tint: LAVENDER, moves: ["pickUp"] },
    { id: "target", text: "Place in target", icon: PLACE_IN_TARGET_ICON, tint: CREAM, moves: ["wrongClaw"] },
  ],
  correctId: "pickup",
  rightTitle: "Nice!",
  right: "Now the robot is holding the cube. What’s next?",
  wrongTitle: "Almost!",
  wrong: "The robot isn’t holding the cube yet. What should it do first?",
  ctaLabel: "Next",
};
