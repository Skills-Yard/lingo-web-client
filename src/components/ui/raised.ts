/**
 * The 3D look of Level 1's "Instructions are…" options, for any pressable: the face
 * stands on a hard 4px edge (with the faint line under it that the quiz has), and
 * pressing sinks the face onto the edge. The edge is a box-shadow, so it takes no
 * room and moves nothing around it; its colour is `--edge`, set with one of `EDGE`.
 *
 * It sets its own `transition`, so a button using it has no other `transition-*`
 * class. It sits on a button that is `enabled`: a disabled one keeps its edge but
 * does not sink. `RAISED_SMALL` is the same for small things (icons, chips), whose
 * edge is 3px. `RAISED_DRAG` is only the edge, for something that is dragged (it
 * does not sink while it is held).
 */
export const RAISED =
  "shadow-[0_4px_0_var(--edge),0_7px_0_rgba(0,0,0,0.06)] transition-[translate,box-shadow,background-color,border-color,opacity] duration-100 ease-out enabled:active:translate-y-1 enabled:active:shadow-[0_0_0_var(--edge)]";
export const RAISED_DRAG = "shadow-[0_4px_0_var(--edge),0_7px_0_rgba(0,0,0,0.06)]";
export const RAISED_SMALL =
  "shadow-[0_3px_0_var(--edge),0_5px_0_rgba(0,0,0,0.06)] transition-[translate,box-shadow,background-color,border-color,opacity] duration-100 ease-out enabled:active:translate-y-[3px] enabled:active:shadow-[0_0_0_var(--edge)]";

/** Edge colours: the quiz's own for a card at rest, picked and wrong, then a darker shade for each colour a button can have. */
export const EDGE = {
  /** A card at rest, whatever its tint (the quiz's). */
  khaki: "[--edge:#BDBA99]",
  /** A card that is picked or right (the quiz's). */
  green: "[--edge:#008566]",
  /** A card that is wrong (the quiz's). */
  red: "[--edge:#B3261E]",
  /** A button filled in the brand teal (#08A4AD). */
  teal: "[--edge:#05767D]",
  /** A button filled in the brand green (#01A17F). */
  brand: "[--edge:#004635]",
  /** A card or button in the brand's green-teal (the one being read). */
  mint: "[--edge:#0B8A6A]",
  /** A button filled in orange. */
  orange: "[--edge:#C9650F]",
  /** A button filled in a blue. */
  blue: "[--edge:#2F63B8]",
  /** A white or pale button, a shade cooler than khaki. */
  pale: "[--edge:#C9CED6]",
} as const;
