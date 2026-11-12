import type { ReactNode } from "react";

/** An answer: words, with a small picture (an emoji, or `node`) where the answer is an object to tap. */
export type Option = { id: string; text: string; emoji?: string; node?: ReactNode; /** A picture file shown beside an answer in words. */ icon?: string };

/** What a stage's picture can draw from. */
export type VisualContext = {
  /** Bumped each time the learner tries again, so an animation can play again. */
  attempt: number;
  picked: string | null;
  checked: boolean;
  correct: boolean;
};

/** One question on a screen: what Hex says, the picture and its answers. */
export type QuizStage = {
  kind: "quiz";
  /** What Hex says (the PDF's description). A long one goes on a card in place of Hex's bubble. */
  line: string;
  /** The picture between the line and the answers. */
  visual?: (context: VisualContext) => ReactNode;
  /** `rows`: answers in words; `grid`: objects to tap (two across). */
  layout?: "rows" | "grid";
  options: readonly Option[];
  correctId: string;
  /** Other picks that are fine too: they are acknowledged and the learner goes on, without a retry. */
  alsoOk?: { ids: readonly string[]; title: string; text: string };
  rightTitle: string;
  right: string;
  wrongTitle?: string;
  wrong: string;
  /** The hint button's help: a sentence in place of Hex's line, and/or a picture. Either makes the button show. */
  hintText?: string;
  hintVisual?: ReactNode;
  /** The hint is shown by itself when the learner tries again. */
  hintOnMiss?: boolean;
  /** A wrong object spills water as it is picked. */
  spill?: boolean;
  /** The answers are the shorter kind (four short ones stand two by two), for a scene that needs the room above them; a screen with a picture (a card) has them anyway. */
  compact?: boolean;
  /** The main button before the answer is checked (default "Continue") and after a right one (default "Next"). */
  ctaLabel?: string;
  nextLabel?: string;
};

/** What an interaction stage hands to what it draws. */
export type InteractionApi = {
  /** The learner got something wrong along the way: it counts as a miss, and is shown as one. */
  slip: () => void;
  /** The learner has done it. */
  done: () => void;
  finished: boolean;
};

/** Something to do instead of a question: tap, drag, slide. The main button waits until it is done. */
export type InteractionStage = {
  kind: "interaction";
  render: (api: InteractionApi) => ReactNode;
  /** Hex's panel on finishing (a right outcome), if the interaction has one. */
  finishPanel?: { title: string; text: string };
  ctaLabel?: string;
  nextLabel?: string;
};

export type Stage = QuizStage | InteractionStage;

/** A screen: its title and the stages the learner goes through (one progress step). */
export type ScreenDef = {
  step: number;
  /** The title; the words between asterisks are picked out in teal ("Let's *Go*"). */
  title: string;
  stages: readonly Stage[];
};

/** A title cut into its plain and teal parts (every other part is teal), and set to fit: one line at 28px, 24px, or two lines at 24px. */
export const parseTitle = (title: string) => {
  const parts = title.split("*");
  const length = parts.join("").length;
  return { parts, twoLines: length > 25, size: length <= 20 ? 28 : 24 };
};
