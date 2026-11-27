/**
 * The Operators module's screens are built from the same parts as the Data
 * Types module's: a screen is a title and stages (a question, or something to
 * do), see `components/datatypes/screen.ts`.
 */
import type { InteractionStage, QuizStage as BaseQuizStage, ScreenDef as BaseScreenDef } from "@/components/datatypes/screen";

export { parseTitle } from "@/components/datatypes/screen";
export type { InteractionApi, InteractionStage, Option, VisualContext } from "@/components/datatypes/screen";

/**
 * A question. `compact` sets the rows of answers shorter (56px), for answers that are only words, so four fit.
 * `keepLine` leaves Hex and his line where they are once the answer is checked, instead of the bubble going off to the left.
 * `threeCards` puts three answers in one row of mini cards even when one has more than two "words" (an expression such as
 * `4 * 5` is three to the word count but a short card's worth), so a picture over them keeps its room. (Not the base type's
 * `cards`, which is a kind of grid tile.)
 */
export type QuizStage = BaseQuizStage & { compact?: boolean; keepLine?: boolean; threeCards?: boolean };

export type Stage = QuizStage | InteractionStage;

/** A screen: its title and the stages the learner goes through (one progress step). */
export type ScreenDef = Omit<BaseScreenDef, "stages"> & { stages: readonly Stage[] };
