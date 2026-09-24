/**
 * The reference design's slightly-3D answer card, shared by both question
 * shapes (QuestionListScreen's rows, QuestionGridScreen's tiles): a white
 * card with 4px corners and a soft shadow, sitting on a thick khaki
 * (`#BDBA99`) bottom edge. Its stroke is black at 4% on the top, left and
 * right, and the same khaki on the bottom. The edge is a hard (zero-blur)
 * box-shadow rather than a border, so it takes no layout space and pressing
 * can "sink" the card onto it — the card moves down by the same amount the
 * edge shrinks, so its bottom stays put. Selected swaps the khaki for the
 * brand green.
 */
export function optionCardClass(selected: boolean): string {
  return `rounded-[4px] border bg-white transition-[transform,box-shadow,background-color,border-color] duration-100 ease-out active:translate-y-[3px] ${
    selected
      ? "border-primary bg-[#F2FBF8] shadow-[0_5px_0_#008566,0_8px_14px_rgba(1,161,127,0.18)] active:shadow-[0_2px_0_#008566,0_4px_8px_rgba(1,161,127,0.14)]"
      : "border-black/4 border-b-[#BDBA99] shadow-[0_5px_0_#BDBA99,0_8px_14px_rgba(0,0,0,0.06)] active:shadow-[0_2px_0_#BDBA99,0_4px_8px_rgba(0,0,0,0.05)]"
  }`;
}
