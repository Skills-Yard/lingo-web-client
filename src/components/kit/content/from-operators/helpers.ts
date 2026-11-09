import { P } from "@/components/kit/content/from-operators/pictures";
import type { Option, QuizStage } from "@/components/kit/content/from-operators/screen";

/** Answers: an id for each (their place), their words and a picture. */
export const options = (rows: readonly (readonly [string, string])[]): Option[] => rows.map(([text, icon], index) => ({ id: String(index), text, icon }));

/** The id of the answer at `index`. */
export const at = (index: number) => String(index);

/** Pictures for answers that mustn't hint at which is right. */
const NEUTRAL = [P.order, P.actions, P.goal, P.short] as const;
export const neutral = (texts: readonly string[]): Option[] => options(texts.map((text, index) => [text, NEUTRAL[index % NEUTRAL.length]] as const));

/** Two answers, Yes and No. */
export const yesNo = (): Option[] =>
  options([
    ["Yes.", P.goal],
    ["No.", P.short],
  ]);

/** True and False. */
export const trueFalse = (): Option[] =>
  options([
    ["True", P.goal],
    ["False", P.short],
  ]);

export const quiz = (stage: Omit<QuizStage, "kind">): QuizStage => ({ kind: "quiz", ...stage });

/** The wrong-answer help used where nothing more specific fits. */
export const LOOK_AGAIN = "Look at the numbers again, and think about what happens to them.";
