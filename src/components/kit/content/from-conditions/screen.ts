/**
 * The Conditions module's screens are built from the same parts as the
 * Operators and Data Types modules': a screen is a title and stages (a
 * question, or something to do), see `components/datatypes/screen.ts` and
 * `components/operators/screen.ts`.
 */
import type { ScreenDef as OperatorsScreenDef } from "@/components/kit/content/from-operators/screen";

export { parseTitle } from "@/components/kit/content/from-operators/screen";
export type { InteractionApi, InteractionStage, Option, QuizStage, Stage, VisualContext } from "@/components/kit/content/from-operators/screen";

/** A screen. With `finish: "gem"`, going on from its last stage opens the gem popup (then the module goes on to the next screen). */
export type ScreenDef = OperatorsScreenDef & { finish?: "gem" };
