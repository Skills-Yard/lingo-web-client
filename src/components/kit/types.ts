/**
 * Shared shapes of the screen kit. Everything a component takes is plain data
 * (strings, numbers, booleans, arrays) plus callbacks, so a screen can be
 * described as data and built from these components at runtime.
 */

/** The card colours an option can have at rest. They only tell cards apart, never which is right. */
export type Tint = "white" | "blue" | "lavender" | "green" | "cream";

/** One answer of a list, a grid, a set of chips. */
export type OptionData = {
  id: string;
  text: string;
  /** A smaller second line under the text. */
  sub?: string;
  /** A picture: a file in `public/images/level-two/`, or a path that starts with "/". */
  image?: string;
  /** A small emoji picture (object cards). */
  emoji?: string;
  /** The card's colour at rest (tiles and chips): a name, or Tailwind classes for a colour of its own. */
  tint?: Tint | (string & {});
};

/** How an answer looks: at rest, picked, the right one after checking, a wrong pick after checking. */
export type OptionState = "idle" | "selected" | "correct" | "wrong";

/** A checked answer, for the progress bar's reaction. A new `id` plays it again. */
export type { AnswerResult } from "@/components/ui/RiveProgressBar";

/** A trigger to fire on an artboard: a new `id` fires `name` again. */
export type TriggerRequest = { name: string; id: number };
