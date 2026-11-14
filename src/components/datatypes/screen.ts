import type { ReactNode } from "react";
import type { Choice } from "@/components/level-two/levelTwo";
import type { SceneValues } from "@/lib/rive/datatypesHost";
import type { DatatypesSceneName } from "@/lib/rive/runtime";

/** An answer: its words and its picture (`icon` is a file, see `pictures.ts`). */
export type Option = Choice;

/** What a stage's picture can draw from. */
export type VisualContext = {
  /** Bumped each time the learner tries again, so an animation can play again. */
  attempt: number;
  picked: string | null;
  checked: boolean;
  correct: boolean;
  /** Hex has finished his line (a picture whose cards wait for him comes in then). Left out by screens that don't pass it. */
  hexSpoken?: boolean;
};

/** The Rive scene behind a stage (see `DATATYPES_SCENES`): which artboard, and the data it is shown with (`mode` and the rest; what is not named is as the file has it). */
export type SceneSpec = {
  scene: DatatypesSceneName;
  values: SceneValues;
  /** A wrong answer fires the scene's `wrong` (default). Left off where the answers are reasons, so a cross on the picture would blame the wrong thing. */
  markWrong?: boolean;
};

/** A stage can have a title of its own, in place of the screen's (a screen's second part, such as 5.2, is headed differently from its first), and a scene. */
type StageTitle = {
  title?: string;
  /** Sets the stage's own title at this size (px) on one line, as `ScreenDef.titleSize` does. */
  titleSize?: number;
  /**
   * A scene stands behind the stage, under Hex's line, in place of its picture, and the answers (or the
   * interaction) go below it. A function sets the data from what the learner has done (a pick lights up one of
   * the scene's things; for an interaction `checked` and `correct` mean it is finished). A right or wrong answer
   * fires the scene's `correct` / `wrong`.
   */
  scene?: SceneSpec | ((context: VisualContext) => SceneSpec);
};

/** One question on a screen: what Hex says, the picture, and the answers. */
export type QuizStage = StageTitle & {
  kind: "quiz";
  /** What Hex says: short (about 60 letters, up to 100). */
  line: string;
  /** Hex's bubble width (px), where the design breaks the line differently from the usual widths. */
  bubbleWidth?: number;
  /** A question set just above the answers, where Hex's line is the set-up. */
  question?: string;
  /** The picture between Hex's line and the answers. */
  visual?: (context: VisualContext) => ReactNode;
  /** `rows`: a list of answers; `grid`: tiles (two across for four or two answers, three for three). */
  layout?: "rows" | "grid";
  /** A `grid` of special cards that stand higher above the button than the usual tiles: `big` (four, screen 8), `badges` (three, each a badge over its word, screen 10). */
  cards?: "big" | "badges";
  options: readonly Option[];
  correctId: string;
  rightTitle: string;
  right: string;
  wrongTitle?: string;
  wrong: string;
  /** The answers stay hidden until Hex has finished his line, then bounce in one by one (screens 1 and 2). */
  optionsAfterHex?: boolean;
  /** The main button before the answer is checked (default "Check") and after a right one (default "Next"). */
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
  /** Hex has finished typing the stage's line (also true when there is none), so something can wait for the line to be read. Left out by the screens that do not say. */
  lineTyped?: boolean;
  /** Takes over the main button: it is enabled, and each press calls `press` instead of going on. Pass null to hand it back (disabled again until the interaction is done). Left out by the screens that do not say. */
  holdButton?: (press: (() => void) | null) => void;
  /** Goes on to the stage after this one at once, with nothing recorded and no panel. Left out by the screens that do not say. */
  next?: () => void;
  /**
   * Says what the stage changes in its scene (a card sent to its bin, a value lit up), over the data the stage's
   * `scene` sets. It is all of what the stage sets, each time: what is left out goes back to the stage's own.
   * Does nothing on a stage without a scene. Left out by the screens that have no scenes.
   */
  setScene?: (values: SceneValues) => void;
  /** Hex has finished his line (a stage whose cards wait for him comes in then). */
  hexSpoken: boolean;
  /**
   * A stage that steps through its own parts (screen 4's groups) takes Continue over: `handler` runs on
   * each press and says whether it used the press (`true`), or Continue should go on to the next screen
   * (`false`). `null` gives Continue back. Left out by screens that don't pass it.
   */
  takeContinue?: (handler: (() => boolean) | null) => void;
};

/** Something to do instead of a question: tap, sort, match. The main button waits until it is done. */
export type InteractionStage = StageTitle & {
  kind: "interaction";
  /** What Hex says above it, if he does (short). */
  line?: string;
  /** Hex's bubble width (px), where the design breaks the line differently from the usual widths. */
  bubbleWidth?: number;
  /** The picture stands at the top of the room under Hex's line, instead of in the middle of it (a design with fixed places). */
  alignTop?: boolean;
  /** Nothing to do, only to look at (screens 5 and 6): Continue waits only for Hex to finish his line, and his line stays. */
  ready?: boolean;
  /** What stands under the line (or under the scene). Left out where the scene is all there is to look at. */
  render?: (api: InteractionApi) => ReactNode;
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
