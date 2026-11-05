import type { ReactNode } from "react";
import type { Choice } from "@/components/level-two/levelTwo";

/** An answer: its words and its picture (`icon` is a file, see `pictures.ts`). */
export type Option = Choice;

/** What a stage's picture can draw from. */
export type VisualContext = {
  /** Bumped each time the learner tries again, so an animation can play again. */
  attempt: number;
  picked: string | null;
  checked: boolean;
  correct: boolean;
};

/** One question on a screen: what Hex says, the picture, and the answers. */
export type QuizStage = {
  kind: "quiz";
  /** What Hex says: short (about 60 letters, up to 100). */
  line: string;
  /** A question set just above the answers, where Hex's line is the set-up. */
  question?: string;
  /** The picture between Hex's line and the answers. */
  visual?: (context: VisualContext) => ReactNode;
  /** `rows`: a list of answers; `grid`: tiles (two across for four or two answers, three for three). */
  layout?: "rows" | "grid";
  options: readonly Option[];
  correctId: string;
  rightTitle: string;
  right: string;
  wrongTitle?: string;
  wrong: string;
  /** The hint button's help: a sentence in place of Hex's line. */
  hintText?: string;
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

/** Something to do instead of a question: tap, sort, match. The main button waits until it is done. */
export type InteractionStage = {
  kind: "interaction";
  /** What Hex says above it, if he does (short). */
  line?: string;
  render: (api: InteractionApi) => ReactNode;
  /** Hex's panel on finishing, if the interaction has one. */
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
