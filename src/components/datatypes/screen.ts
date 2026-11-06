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
  /** The answers stay hidden until Hex has finished his line, then bounce in one by one (screens 1 and 2). */
  optionsAfterHex?: boolean;
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
  /** Sends Hex's line above the picture away, for a stage that talks through its own Hex lower down (screen 4). */
  dismissHex: () => void;
  finished: boolean;
  /** Hex has finished his line (a stage whose cards wait for him comes in then). */
  hexSpoken: boolean;
};

/** Something to do instead of a question: tap, sort, match. The main button waits until it is done. */
export type InteractionStage = {
  kind: "interaction";
  /** What Hex says above it, if he does (short). */
  line?: string;
  /** Hex's bubble width (px), where the design breaks the line differently from the usual widths. */
  bubbleWidth?: number;
  /** The picture stands at the top of the room under Hex's line, instead of in the middle of it (a design with fixed places). */
  alignTop?: boolean;
  /** Nothing to do, only to look at (screens 5 and 6): Continue is there from the start and Hex's line stays. */
  ready?: boolean;
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
  /** Sets the title at this size (px) on one line, instead of fitting it by its length (see `parseTitle`). */
  titleSize?: number;
  /** A picture behind the whole screen, the title and Hex included (it goes in the shell's scene slot). */
  backdrop?: ReactNode;
  stages: readonly Stage[];
};

/** A title cut into its plain and teal parts (every other part is teal), and set to fit: one line at 28px, 24px, or two lines at 24px. */
export const parseTitle = (title: string) => {
  const parts = title.split("*");
  const length = parts.join("").length;
  return { parts, twoLines: length > 25, size: length <= 20 ? 28 : 24 };
};
