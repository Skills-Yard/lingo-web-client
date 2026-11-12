import { EDGE } from "@/components/ui/raised";
import type { OptionState, Tint } from "./types";

/**
 * The look every kit component shares, in one place: the colours of a card at
 * rest and in each state, the text styles, the springs. (The class names are
 * written out in full so Tailwind finds them.)
 */

/** A card's colour at rest. */
export const TINT: Record<Tint, string> = {
  white: "bg-white dark:bg-[#15181E]",
  blue: "bg-[#E5EFFD] dark:bg-[#15233A]",
  lavender: "bg-[#F6F4FE] dark:bg-[#0F1F26]",
  green: "bg-[#ECF7ED] dark:bg-[#10261A]",
  cream: "bg-[#FFF3DE] dark:bg-[#2A2218]",
};

/** The classes of a tint given by name, or (for a colour of its own) as classes. */
export const tintClass = (tint: string | undefined): string => TINT[(tint ?? "white") as Tint] ?? tint;

/** A card (a row or a tile) once it is picked or checked. At rest each shape has its own look. */
export const STATE_CARD: Record<Exclude<OptionState, "idle">, string> = {
  selected: "border-primary bg-[#F2FBF8] dark:bg-[#0F2921]",
  correct: "border-primary bg-[#F2FBF8] dark:bg-[#0F2921]",
  wrong: "border-[#E5484D] bg-[#FFF1F1] dark:bg-[#2A1517]",
};

/**
 * The 3D edge an answer card stands on, in its state's colour: khaki at rest, green once picked or right,
 * red when wrong. Goes with `RAISED` (which sets its own transition, so the card has no other `transition-*`).
 */
export const STATE_EDGE: Record<OptionState, string> = {
  idle: EDGE.khaki,
  selected: EDGE.green,
  correct: EDGE.green,
  wrong: EDGE.red,
};

/** How a card shakes from side to side when a tap on it was wrong (px, as keyframes). */
export const WRONG_SHAKE = [0, -7, 7, -5, 5, 0];

/** The hint's fill, wiped across a card behind its content. */
export const HINT_FILL = "bg-[#FFE7D1] dark:bg-[#33220F]";

/** Text. */
export const TEXT = {
  /** A screen's title. */
  title: "font-semibold leading-[134%] text-[#444444] dark:text-white",
  /** Body copy. */
  body: "text-[16px] leading-6 font-medium text-[#666666] dark:text-white/70",
  /** The words on a card. */
  card: "font-semibold text-[#444444] dark:text-white",
  /** Small helper text. */
  note: "text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60",
} as const;

/** The brand's teal and the colours around it. */
export const COLOR = {
  teal: "#08A4AD",
  tealDeep: "#067F86",
  green: "#01A17F",
  red: "#D42421",
  orange: "#FF8D42",
} as const;

/** The spring answers settle with when a result panel arrives. */
export const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

/** The answers' own way in: they rise from below and settle. */
export const ANSWERS_IN = {
  opacity: { duration: 0.3, delay: 0.3 },
  y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 },
} as const;
