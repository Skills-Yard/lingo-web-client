import type { CSSProperties } from "react";
import { soloDrawnWidth } from "@/components/level-one/ActionRow";

/**
 * The width of the Operators module's content (a CSS length, in the stage's px): the same as the top bar's and the Continue button's
 * drawn width, so the cards, boxes, answers and pictures line up with both. `LevelOneShell` gives the button's row `FRAME_W + 60` (450)
 * at most; on a phone this is the 390px frame less 20.4px at each side (349.2), where the module's content used to be 340 or 316 wide.
 */
export const BAR_W = soloDrawnWidth(450);

/**
 * Set on a block of a screen, it makes everything in it that is as wide as the question column (`COLUMN_W`: the answers, the question,
 * the shared stages) and everything of the module's own (`w-(--column-w)`) this wide. Not put on the title: its lines are broken for the
 * old column, and a wider one could take a second line away.
 */
export const COLUMN_STYLE = { "--column-w": BAR_W } as CSSProperties;

/**
 * The same for the picture group of a screen, which is drawn `fit` times its size (see `OperatorsScreen`) to fit the room under Hex's
 * line: laid out `1 / fit` wider, it comes out this module's width on the screen, instead of `fit` of it.
 */
export const fittedColumn = (fit: number) => ({ "--column-w": `calc(${BAR_W} / ${fit})` }) as CSSProperties;
