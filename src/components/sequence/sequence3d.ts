import { IMAGES, SOCKS_FIRST, STEP, type SequenceQuiz } from "./sequence";
import { struggled } from "./sequenceScore";

/**
 * The 3D Sequence flow (`/module/sequence-3d?step=N`): every screen of the original module
 * (`/module/sequence`), in the order they play here, `?step=` being the place in this list
 * (from 1). A frame that is a copy of a screen of the original module names its `step` there
 * (so that screen's own code, which knows only its own step, finds its place here: see
 * `sequenceFlow.tsx`); the others exist only here (the Figma frames the original has no
 * screen for). After the last, Next opens "Lesson complete!" (`?step=complete`).
 */
export const FLOW_3D = [
  { id: "intro" },
  { id: "aarav" },
  { id: "putOnFirst", step: STEP.putOnFirst },
  { id: "socks", step: STEP.socks },
  { id: "shoes", step: STEP.shoes },
  { id: "ready", step: STEP.ready },
  { id: "whatDid", step: STEP.whatDid },
  { id: "compare", step: STEP.compare },
  { id: "shoesFirst" },
  { id: "whatWillHappen", step: STEP.thinkAhead },
  { id: "firstCommand", step: STEP.firstCommand },
  { id: "arrange", step: STEP.arrange },
  { id: "meet", step: STEP.meet },
  { id: "reveal", step: STEP.reveal },
  { id: "dress", step: STEP.dress },
  { id: "hexIntro", step: STEP.hexIntro },
  { id: "oneCommand", step: STEP.oneCommand },
  { id: "hexOrder", step: STEP.hexOrder },
  { id: "predict", step: STEP.predict },
  { id: "predictNext", step: STEP.predictNext },
  { id: "fix", step: STEP.fix },
  { id: "plan", step: STEP.plan },
  { id: "planNext", step: STEP.planNext },
  { id: "tea", step: STEP.tea },
  { id: "reflectOrder", step: STEP.reflectOrder },
  { id: "reflectDecide", step: STEP.reflectDecide },
  { id: "recap", step: STEP.recap },
] as const;

export type Flow3dId = (typeof FLOW_3D)[number]["id"];

/** The progress bar's length: every frame of the flow. */
export const SEQUENCE_3D_STEPS = FLOW_3D.length;

export const sequence3dHref = (position: number | "complete") => `/module/sequence-3d?step=${position}`;

/** Where frame `id` is in the flow (from 1). */
export const positionOf = (id: Flow3dId) => FLOW_3D.findIndex((frame) => frame.id === id) + 1;

/** Where the copy of the original module's screen `step` is in the flow, or 0 if it has none. */
export const positionOfStep = (step: number) => FLOW_3D.findIndex((frame) => "step" in frame && frame.step === step) + 1;

/** True where the frame at `position` copies the original module's screen `step`. */
const isCopyOf = (position: number, step: number) => {
  const frame = FLOW_3D[position - 1];
  return !!frame && "step" in frame && frame.step === step;
};

/**
 * The frame after the one at `position`; after the last, "Lesson complete!". As in the original
 * module, the harder route to plan is only for a learner who planned the first one without help.
 */
export const sequence3dNext = (position: number) => {
  if (isCopyOf(position, STEP.plan) && struggled(STEP.plan)) return sequence3dHref(positionOfStep(STEP.tea));
  return position < FLOW_3D.length ? sequence3dHref(position + 1) : sequence3dHref("complete");
};

/** The frame before the one at `position`; before the first, the level path. */
export const sequence3dPrevious = (position: number) => {
  if (position <= 1) return "/level";
  if (isCopyOf(position, STEP.tea) && struggled(STEP.plan)) return sequence3dHref(positionOfStep(STEP.plan));
  return sequence3dHref(position - 1);
};

/** "What if shoes go first?" is followed by this question: the original screen 7's, with the title and the three answers of the design (Figma `sequence_7`). */
export const WHAT_WILL_HAPPEN: SequenceQuiz = {
  ...SOCKS_FIRST,
  title: [[{ text: "What will " }, { text: "happen?", teal: true }]],
  choices: [
    { id: "harder", text: "Socks will be harder to put on", icon: `${IMAGES}/put-on-socks.webp` },
    { id: "off", text: "Shoes will come off automatically", icon: `${IMAGES}/put-on-shoes.webp` },
    { id: "same", text: "Order does not matter", icon: `${IMAGES}/icon-same-order.svg` },
  ],
};
