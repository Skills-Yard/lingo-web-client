/**
 * The reference design's slightly-3D answer card, shared by both question
 * shapes (QuestionListScreen's rows, QuestionGridScreen's tiles): a white
 * card with 8px corners and a soft shadow, sitting on a thick khaki
 * (`#BDBA99`) bottom edge. Its stroke is black at 4% on the top, left and
 * right, and the same khaki on the bottom. The edge is a hard (zero-blur)
 * box-shadow rather than a border, so it takes no layout space and pressing
 * can "sink" the card onto it — the card moves down by the same amount the
 * edge shrinks, so its bottom stays put. Selected swaps the khaki for the
 * brand green.
 *
 * `flatDark` (the picture-over-label grid tiles): in dark mode an idle card
 * draws nothing of its own — its two segments carry the fill and the grey
 * stroke (see QuestionGridScreen).
 *
 * `spotlight` is the option the fox is reading out right now: it borrows the
 * selected look plus a slight scale-up, without actually being selected.
 * (Tailwind v4's scale/translate utilities set the individual `scale` and
 * `translate` properties, hence those — not `transform` — in the transition.)
 */
export function optionCardClass(selected: boolean, spotlight = false, flatDark = false): string {
  const lit = selected || spotlight;
  const idleDark = flatDark
    ? "dark:border-transparent dark:bg-transparent dark:shadow-none dark:active:shadow-none"
    : "dark:border-white/6 dark:border-b-[#2A2E37] dark:bg-[#15181E] dark:shadow-[0_5px_0_#2A2E37,0_8px_14px_rgba(0,0,0,0.4)] dark:active:shadow-[0_2px_0_#2A2E37,0_4px_8px_rgba(0,0,0,0.3)]";
  const state = lit
    ? "border-primary bg-[#F2FBF8] dark:bg-[#0F2921] shadow-[0_5px_0_#008566,0_8px_14px_rgba(1,161,127,0.18)] active:shadow-[0_2px_0_#008566,0_4px_8px_rgba(1,161,127,0.14)]"
    : `border-black/4 border-b-[#BDBA99] shadow-[0_5px_0_#BDBA99,0_8px_14px_rgba(0,0,0,0.06)] active:shadow-[0_2px_0_#BDBA99,0_4px_8px_rgba(0,0,0,0.05)] ${idleDark}`;
  return `rounded-[8px] border bg-white transition-[scale,translate,box-shadow,background-color,border-color] duration-200 ease-out active:translate-y-[3px] ${
    spotlight ? "scale-[1.04]" : ""
  } ${state}`;
}
