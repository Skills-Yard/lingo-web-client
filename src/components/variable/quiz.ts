import type { ReactNode } from "react";

/**
 * A button at rest (answers, rows and cards alike): a thin grey line all round (1px; a card adds `border`) and a very
 * light shade, so its top and sides show against the white page as well as the raised edge under it (a white border on
 * white left only that edge). Picking it swaps this for the 4px green or red look (see `LOOKS`).
 */
export const IDLE_LOOK = "border-[#DCE2E9] bg-white drop-shadow-[0_1px_2px_rgba(31,42,68,0.07)] dark:border-white/10 dark:bg-[#15181E]";

/**
 * The size and the spacing of every option in the Variable module, the same on every screen: the answers (rows or
 * cards), screen 2's picture cards, screen 27's steps and screen 14's name / value buttons. Change a number here and
 * they all change together. Only an option with a picture above its words (a card) is taller; the padding, the gap, the
 * corners and the text are the same for all.
 */
export const OPTION = {
  /** An option of words (px): a row or a card. */
  height: 56,
  /** A card with a picture above its words. */
  pictureHeight: 110,
  /**
   * Between options, across and down. Wide enough that rows read as separate lines: each row's raised 4px edge and the
   * faint shade under it sit inside this gap, so about 4px of it would show at 8. Three rows (3 × 56 + 2 × 14 = 196px)
   * still stand just below the scene (it ends 520 down, they start 524), and three cards across still fit the column.
   */
  gap: 14,
  /**
   * From an option's outer edge to what is inside it, its border included (a 1px line at rest plus 11, or a 4px green or
   * red border plus 8, or a 2px one plus 10). 12 so that the widest pair of four words (screen 15's "Students absent"
   * and "Students present", side by side with the 14px gap) still fits the 340px column.
   */
  padX: 12,
  /** The corners. */
  radius: 16,
  /** The text. */
  font: 16,
  /** Once the result panel is up the options rise this far (it starts 600px down on a phone, they end 720 down), so they stay clear of it and stop as low as they can, under the scene that has risen to the head. */
  rise: 132,
} as const;

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
