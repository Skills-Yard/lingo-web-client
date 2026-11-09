/**
 * The look of the module's first six screens, kept in one place so every screen's
 * cards, groups and outlines agree: screen 3's cards, screen 4's group names and
 * outlines, screens 5 and 6's tiles.
 */

/** The cards' tints: they only tell the cards apart, they never say which ones belong together (screen 1's answer tiles use them too). */
export const TINTS = {
  blue: "bg-[#E5EFFD] dark:bg-[#15233A]",
  lavender: "bg-[#F6F4FE] dark:bg-[#0F1F26]",
  green: "bg-[#ECF7ED] dark:bg-[#10261A]",
  cream: "bg-[#FFF3DE] dark:bg-[#2A2218]",
} as const;

export type GroupTint = keyof typeof TINTS;

/** The order the tints go round in, for a run of cards that has nothing else to tell them apart. */
const TINT_CYCLE = ["blue", "lavender", "green", "cream"] as const satisfies readonly GroupTint[];

/** The tint of the card at `index` in a run, going round the four. */
export const tintAt = (index: number) => TINTS[TINT_CYCLE[index % TINT_CYCLE.length]];

/** The colour of a group's name (a text colour class) goes with the group's tint. */
export const INK = {
  violet: "text-[#8E82FF]",
  orange: "text-[#FF8D42]",
  blue: "text-[#5B9BFF]",
  teal: "text-[#10B48C]",
} as const;

/** A card, as the design has it: a 4px white edge, a soft shadow, Poppins 600 16px inside (its size is the screen's to give). */
export const CARD_BODY = "flex items-center justify-center rounded-[8px] border-4 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)]";
/** Screen 3's card: 104 x 52. */
export const CARD_LOOK = `${CARD_BODY} h-[52px] w-[104px]`;

/** A card's edge at rest, and when it is the one picked up (screen 3's blue). */
export const EDGE_IDLE = "border-white dark:border-transparent";
export const EDGE_PICKED = "border-[#5B9BFF]";
/** The outline of the card or group being read (the brand's green-teal, screen 4). */
export const EDGE_READING = "border-[#10B48C]";

/** A group that a picked card can go into (screen 3's dashed blue outline). */
export const RECEIVING = "cursor-pointer bg-[#EAF2FE]/70 outline-2 outline-offset-2 outline-[#5B9BFF] outline-dashed dark:bg-white/10";

/** An empty place in a group, where its first card will land (screen 3's gray slot). */
export const EMPTY_SLOT = "flex h-[52px] items-center justify-center rounded-[8px] border-[3px] border-b-4 border-[#C4C4C4] bg-[#F0F0F0] shadow-[inset_0_6px_6px_-3px_rgba(0,0,0,0.18)] dark:border-white/20 dark:bg-white/10";

/** The text on a card: Poppins 600 16px. */
export const CARD_TEXT = "text-[16px] leading-[110%] font-semibold text-[#444444] dark:text-white";
