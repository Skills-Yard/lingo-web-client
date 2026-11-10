import type { BubbleSize, Choice, Span, TitleLines } from "@/components/level-two/levelTwo";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { sequenceHref } from "@/lib/routes";
import type { RoomDress } from "./SequenceRoom";
import { struggled } from "./sequenceScore";

/** The Sequence module's screens, for its progress bar. */
export const SEQUENCE_STEPS = 24;

/** Its place on the level path. */
export const SEQUENCE_LEVEL = 2;

/** Where each screen sits in the module (`/module/sequence?step=`). */
export const STEP = {
  putOnFirst: 1,
  socks: 2,
  shoes: 3,
  ready: 4,
  whatDid: 5,
  compare: 6,
  thinkAhead: 7,
  firstCommand: 8,
  arrange: 9,
  meet: 10,
  reveal: 11,
  dress: 12,
  hexIntro: 13,
  oneCommand: 14,
  hexOrder: 15,
  predict: 16,
  predictNext: 17,
  fix: 18,
  plan: 19,
  planNext: 20,
  tea: 21,
  reflectOrder: 22,
  reflectDecide: 23,
  recap: 24,
} as const;

/** Where the main button goes after screen `step`. The harder route to plan is only for a learner who planned the first one without help. */
export const sequenceNext = (step: number) => {
  if (step >= SEQUENCE_STEPS) return sequenceHref("complete");
  if (step === STEP.plan && struggled(STEP.plan)) return sequenceHref(STEP.tea);
  return sequenceHref(step + 1);
};

/** Where the Back arrow goes from screen `step`. */
export const sequencePrevious = (step: number) => {
  if (step <= 1) return "/level";
  if (step === STEP.tea && struggled(STEP.plan)) return sequenceHref(STEP.plan);
  return sequenceHref(step - 1);
};

export const IMAGES = "/images/sequence";
/** The important mark beats the cards' own `dark:border-transparent`, which the first lesson keeps. */
const DARK_BORDER = "dark:border-[#818185]!";
const LAVENDER = `bg-[#F6F4FE] dark:bg-[#0F1F26] ${DARK_BORDER}`;
const CREAM = `bg-[#FFF9F0] dark:bg-[#0F1F26] ${DARK_BORDER}`;
export const SOCKS_ON_SHOES_ON = `${IMAGES}/socks-then-shoes.webp`;
export const SHOES_THEN_SOCKS = `${IMAGES}/shoes-then-socks.webp`;

/** The two moves the rest of the module is about: the same cards on every screen that shows them. */
export const PICK_UP_ICON = "/images/level-two/step-13.1.svg";
export const PLACE_IN_TARGET_ICON = "/images/level-two/step-13.3.svg";

/** A picture beside another, that isn't an answer. */
export type PictureCard = { text: string; icon: string; tint: string };

/** A picture that is on a screen of its own accord (not an answer), `top` in Figma frame px. */
export type ScenePicture = { src: string; width: number; top: number };

export type SequenceQuiz = {
  step: number;
  title: TitleLines;
  /** The title is set a little smaller: it would otherwise reach the screen's edges. */
  smallTitle?: boolean;
  /** The title's size (px), where it is a question that wraps over two lines. */
  titleSize?: number;
  /** The title may wrap onto a second line. */
  wrapTitle?: boolean;
  /** The title once the answer is checked, where it changes. */
  resultTitle?: TitleLines;
  line: readonly Span[];
  bubble: BubbleSize;
  /** Where Hex's row starts (Figma `top`). */
  bubbleTop: number;
  /** What is behind the screen: an illustration, the robot, or the soft wash. A `fixed` room keeps its place and size once checked, and the answers clear so the boy stays in view. `clearOnRight` does the same for a right answer only, and the boy moves once the answers are gone. */
  scene: { room: { start: RoomDress; right: RoomDress; wrong: RoomDress; fixed?: boolean; clearOnRight?: boolean } } | { robot: true } | { plain: true };
  /** Two pictures to compare, above the answers. */
  pictures?: readonly [PictureCard, PictureCard];
  /** One picture above the answers; it rises as the answers do. */
  closeUp?: ScenePicture;
  /** What is shown, in front of the scene, after a wrong answer (the character trying it again). */
  wrongPicture?: ScenePicture;
  /** The answers: two big cards or a list of rows. */
  layout: "pair" | "list";
  choices: readonly Choice[];
  correctId: string;
  /** The picture box's width, where a card's art is wider than the layout's. */
  pictureWidth?: number;
  /** The picture box's height, where a card's art is larger than the layout's. */
  pictureHeight?: number;
  /** The height of a big card, where it should differ from the layout's. */
  cardHeight?: number;
  rightTitle: string;
  right: string;
  wrongTitle: string;
  wrong: string;
  /** A wrong pick's own message, where it differs from the others. */
  wrongBy?: Readonly<Record<string, { title: string; text: string }>>;
  /** A wrong answer is not tried again: the button just moves on. */
  noRetry?: boolean;
  /** The screen has no hint button. */
  noHint?: boolean;
  /** Hex and his line stay where they are once checked, instead of leaving to the left. */
  hexStays?: boolean;
  /** The main button before the answer is checked (default "Continue"). */
  ctaLabel?: string;
  /** Clips read when the screen opens (the title, then Hex's line). */
  voiceover?: readonly string[];
  /** Read instead once the answer is checked, where the screen has a new title. */
  resultVoiceover?: readonly string[];
};

/** Screen 1 — "What to put on first?" */
export const PUT_ON_FIRST: SequenceQuiz = {
  step: STEP.putOnFirst,
  title: [[{ text: "What to put on " }, { text: "first?", teal: true }]],
  resultTitle: [[{ text: "Let’s try " }, { text: "your order!", teal: true }]],
  line: [{ text: "Let’s get ready before going out." }],
  bubble: { width: 170, short: true },
  bubbleTop: 150,
  scene: { room: { start: "bare", right: "socks", wrong: "shoesOnly", fixed: true } },
  layout: "pair",
  pictureWidth: 105,
  cardHeight: 140,
  choices: [
    { id: "socks", text: "Socks", icon: `${IMAGES}/put-on-socks.webp`, tint: LAVENDER },
    { id: "shoes", text: "Shoes", icon: `${IMAGES}/put-on-shoes.webp`, tint: CREAM },
  ],
  correctId: "socks",
  rightTitle: "Nice!",
  right: "Socks go on first. Now the next step!",
  wrongTitle: "Oops!",
  wrong: "Shoes go on after socks. Try socks first!",
  voiceover: SEQUENCE_AUDIO.putOnFirst,
  resultVoiceover: SEQUENCE_AUDIO.tryYourOrder,
};

/** Screen 5 — "What did you do?": every pick gets its own message, and Continue moves on. */
export const WHAT_DID_YOU_DO: SequenceQuiz = {
  step: STEP.whatDid,
  title: [[{ text: "What did " }, { text: "you do?", teal: true }]],
  line: [{ text: "You wore socks first, then shoes, before heading out." }],
  bubble: { width: 230 },
  bubbleTop: 150,
  scene: { plain: true },
  closeUp: { src: SOCKS_ON_SHOES_ON, width: 215, top: 272 },
  layout: "list",
  choices: [
    { id: "random", text: "In random order", icon: `${IMAGES}/icon-random.svg` },
    { id: "order", text: "In the right order", icon: `${IMAGES}/icon-order.svg` },
    { id: "unsure", text: "Don’t know", icon: `${IMAGES}/icon-unsure.svg` },
  ],
  correctId: "order",
  rightTitle: "Exactly!",
  right: "You did them in order, and it worked.",
  wrongTitle: "Think again!",
  wrong: "Your actions followed a clear order.",
  wrongBy: {
    random: { title: "Think again!", text: "Your actions followed a clear order." },
    unsure: { title: "No worry!", text: "Socks came first, then shoes. That is an order." },
  },
  noRetry: true,
  noHint: true,
  ctaLabel: "Check",
};

/** Screen 6 — "Compare both attempts". */
export const COMPARE_ATTEMPTS: SequenceQuiz = {
  step: STEP.compare,
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
    { id: "actions", text: "The actions", icon: `${IMAGES}/icon-actions.svg` },
    { id: "order", text: "The order", icon: `${IMAGES}/icon-order.svg` },
    { id: "goal", text: "The goal", icon: `${IMAGES}/icon-goal.svg` },
  ],
  correctId: "order",
  rightTitle: "Exactly!",
  right: "Same actions, but the order changed the result.",
  wrongTitle: "Not quite",
  wrong: "Same actions, same goal. Look at what came first.",
  voiceover: SEQUENCE_AUDIO.compareAttempts,
};

/** Screen 7 — "Think one step ahead." */
export const SOCKS_FIRST: SequenceQuiz = {
  step: STEP.thinkAhead,
  title: [[{ text: "Think one step " }, { text: "ahead.", teal: true }]],
  line: [{ text: "Let’s get ready again. Your shoes are already on." }],
  bubble: { width: 230 },
  bubbleTop: 150,
  scene: { room: { start: "shoesOnly", right: "trySocks", wrong: "shoesOnly", clearOnRight: true } },
  layout: "list",
  choices: [
    { id: "harder", text: "Socks are hard to put on", icon: `${IMAGES}/put-on-socks.webp` },
    { id: "off", text: "Shoes come off by themselves", icon: `${IMAGES}/put-on-shoes.webp` },
    { id: "same", text: "No problem", icon: `${IMAGES}/icon-repeat.svg` },
  ],
  correctId: "harder",
  wrongPicture: { src: SHOES_THEN_SOCKS, width: 230, top: 168 },
  rightTitle: "Good thinking!",
  right: "Some actions must happen before others.",
  wrongTitle: "Not quite",
  wrong: "The wrong order makes getting ready harder.",
  voiceover: SEQUENCE_AUDIO.socksFirst,
};

/** Screen 8 — "What's the first command?" */
export const FIRST_COMMAND: SequenceQuiz = {
  step: STEP.firstCommand,
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
  wrong: "The cube isn’t picked up yet. What comes first?",
  ctaLabel: "Next",
  voiceover: SEQUENCE_AUDIO.firstCommand,
};

/** Screen 22 — "Why does the proper order of commands matter?" */
export const REFLECT_ORDER: SequenceQuiz = {
  step: STEP.reflectOrder,
  title: [[{ text: "Why does " }, { text: "sequence", teal: true }, { text: " matter?" }]],
  titleSize: 26,
  line: [{ text: "Think back to what you discovered." }],
  bubble: { width: 190 },
  bubbleTop: 180,
  scene: { plain: true },
  layout: "list",
  choices: [
    { id: "alphabetical", text: "Alphabetical order", icon: `${IMAGES}/icon-alphabet.svg` },
    { id: "goal", text: "It helps reach the goal", icon: `${IMAGES}/icon-goal.svg` },
  ],
  correctId: "goal",
  rightTitle: "Exactly!",
  right: "The right order helps reach the goal.",
  wrongTitle: "Not quite",
  wrong: "Order isn’t alphabetical. It helps reach the goal.",
  noRetry: true,
  noHint: true,
  hexStays: true,
  ctaLabel: "Check",
};

/** Screen 23 — "How do you decide which command should come first?" */
export const REFLECT_DECIDE: SequenceQuiz = {
  step: STEP.reflectDecide,
  title: [[{ text: "Which " }, { text: "command", teal: true }, { text: " goes first?" }]],
  titleSize: 26,
  line: [{ text: "One more. Think about how you chose the order." }],
  bubble: { width: 190 },
  bubbleTop: 180,
  scene: { plain: true },
  layout: "list",
  choices: [
    { id: "before", text: "What must happen first", icon: `${IMAGES}/icon-think.svg` },
    { id: "shortest", text: "The shortest command", icon: `${IMAGES}/icon-short.svg` },
    { id: "random", text: "Randomly", icon: `${IMAGES}/icon-random.svg` },
  ],
  correctId: "before",
  rightTitle: "Exactly!",
  right: "What happens first decides the order.",
  wrongTitle: "Not quite",
  wrong: "What must happen first decides the order.",
  noRetry: true,
  noHint: true,
  ctaLabel: "Check",
};
