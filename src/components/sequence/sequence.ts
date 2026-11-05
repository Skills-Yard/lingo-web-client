import type { BubbleSize, Choice, Span, TitleLines } from "@/components/level-two/levelTwo";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { sequenceHref } from "@/lib/routes";
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
const LAVENDER = "bg-[#F6F4FE] dark:bg-[#0F1F26]";
const CREAM = "bg-[#FFF9F0] dark:bg-[#0F1F26]";
export const GETTING_READY_SCENE = `${IMAGES}/getting-ready-scene.webp`;
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
  /** What is behind the screen: an illustration, the robot, or the soft wash. */
  scene: { image: string } | { robot: true } | { plain: true };
  /** Two pictures to compare, above the answers. */
  pictures?: readonly [PictureCard, PictureCard];
  /** One picture above the answers; it rises as the answers do. */
  closeUp?: ScenePicture;
  /** What is shown, in front of the scene, after a wrong answer (the character trying it again). */
  wrongPicture?: ScenePicture;
  /** A question set just above the answers, where Hex's line is the set-up. */
  question?: string;
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
  /** A wrong pick's own message, where it differs from the others. */
  wrongBy?: Readonly<Record<string, { title: string; text: string }>>;
  /** A wrong answer is not tried again: the button just moves on. */
  noRetry?: boolean;
  /** The screen has no hint button. */
  noHint?: boolean;
  /** What the hint says in Hex's bubble (it also lights up the right card). */
  hintText?: string;
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
  voiceover: SEQUENCE_AUDIO.putOnFirst,
  resultVoiceover: SEQUENCE_AUDIO.tryYourOrder,
};

/** Screen 5 — "What did you do?": every pick gets its own message, and Continue moves on. */
export const WHAT_DID_YOU_DO: SequenceQuiz = {
  step: STEP.whatDid,
  title: [[{ text: "What did " }, { text: "you do?", teal: true }]],
  line: [{ text: "You put on your socks first and then shoes before heading outside." }],
  bubble: { width: 230 },
  bubbleTop: 150,
  scene: { plain: true },
  closeUp: { src: SOCKS_ON_SHOES_ON, width: 215, top: 272 },
  layout: "list",
  choices: [
    { id: "random", text: "Performed Actions randomly", icon: "", badge: "A" },
    { id: "order", text: "Performed Actions in Proper Order", icon: "", badge: "B" },
    { id: "unsure", text: "Don’t Know", icon: "", badge: "C" },
  ],
  correctId: "order",
  rightTitle: "Correct!",
  right: "Yes, you have performed the actions in the correct order.",
  wrongTitle: "Okay!",
  wrong: "You might perform actions randomly, but they worked in proper order.",
  wrongBy: {
    random: { title: "Okay!", text: "You might perform actions randomly, but they worked in proper order." },
    unsure: { title: "No worry!", text: "Remember that all actions were performed in proper order." },
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
    { id: "actions", text: "The actions themselves", icon: `${IMAGES}/icon-actions.svg` },
    { id: "order", text: "The order of actions", icon: `${IMAGES}/icon-order.svg` },
    { id: "goal", text: "The goal", icon: `${IMAGES}/icon-goal.svg` },
  ],
  correctId: "order",
  rightTitle: "Exactly!",
  right: "The actions were the same, but their order changed the result.",
  wrongTitle: "Not quite",
  wrong: "Both attempts use the same actions and share a goal. Look at what came first.",
  voiceover: SEQUENCE_AUDIO.compareAttempts,
};

/** Screen 7 — "Think one step ahead." */
export const SOCKS_FIRST: SequenceQuiz = {
  step: STEP.thinkAhead,
  title: [[{ text: "Think one step " }, { text: "ahead.", teal: true }]],
  line: [{ text: "Imagine you are getting ready again. You have already put on your shoes." }],
  bubble: { width: 230 },
  bubbleTop: 150,
  scene: { image: GETTING_READY_SCENE },
  question: "What happens if you try to put on your socks now?",
  layout: "list",
  choices: [
    { id: "harder", text: "It will be difficult to put on the socks.", icon: `${IMAGES}/put-on-socks.webp` },
    { id: "off", text: "The shoes will automatically come off.", icon: `${IMAGES}/put-on-shoes.webp` },
    { id: "same", text: "No Problem", icon: `${IMAGES}/icon-repeat.svg` },
  ],
  correctId: "harder",
  hintText: "Would it be easier to put on socks before or after putting on shoes?",
  wrongPicture: { src: SHOES_THEN_SOCKS, width: 230, top: 168 },
  rightTitle: "Good thinking!",
  right: "Some actions need to happen before others.",
  wrongTitle: "Not quite",
  wrong: "Doing the steps in the wrong order makes getting ready harder.",
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
  wrong: "The robot isn’t holding the cube yet. What should it do first?",
  ctaLabel: "Next",
  voiceover: SEQUENCE_AUDIO.firstCommand,
};

/** Screen 22 — "Why does the proper order of commands matter?" */
export const REFLECT_ORDER: SequenceQuiz = {
  step: STEP.reflectOrder,
  title: [[{ text: "Why does the " }, { text: "proper order", teal: true }, { text: " of commands matter?" }]],
  titleSize: 22,
  wrapTitle: true,
  line: [{ text: "Think back to what you discovered." }],
  bubble: { width: 190 },
  bubbleTop: 180,
  scene: { plain: true },
  layout: "list",
  choices: [
    { id: "alphabetical", text: "Commands must always be written in alphabetical order.", icon: "", badge: "A" },
    { id: "goal", text: "The proper order helps to achieve the goal.", icon: "", badge: "B" },
  ],
  correctId: "goal",
  rightTitle: "Exactly!",
  right: "A sequence puts instructions in an order that helps achieve the intended result.",
  wrongTitle: "Not quite",
  wrong: "Order isn’t about the alphabet. A good order is what helped the robot and Hex reach their goals.",
  noRetry: true,
  noHint: true,
  ctaLabel: "Check",
};

/** Screen 23 — "How do you decide which command should come first?" */
export const REFLECT_DECIDE: SequenceQuiz = {
  step: STEP.reflectDecide,
  title: [[{ text: "How do you decide which " }, { text: "command", teal: true }, { text: " should come first?" }]],
  titleSize: 22,
  wrapTitle: true,
  line: [{ text: "One more. Think about how you chose the order." }],
  bubble: { width: 190 },
  bubbleTop: 180,
  scene: { plain: true },
  layout: "list",
  choices: [
    { id: "before", text: "Think about what must happen before the next action.", icon: "", badge: "A" },
    { id: "shortest", text: "Always choose the shortest command first.", icon: "", badge: "B" },
    { id: "random", text: "Choose commands randomly.", icon: "", badge: "C" },
  ],
  correctId: "before",
  rightTitle: "That’s the idea!",
  right: "Think about what needs to happen first, then choose the next action based on the situation.",
  wrongTitle: "Not quite",
  wrong: "Look at what must happen before the next action: that decides which command comes first.",
  noRetry: true,
  noHint: true,
  ctaLabel: "Check",
};
