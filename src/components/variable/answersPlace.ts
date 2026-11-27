import { underAbove } from "@/components/level-two/LevelTwoShell";
import { GAP_BELOW_SCENE, liftTransition, SCENE_BOTTOM, SCENE_BOTTOM_LIFTED } from "./scenes";
import { OPTION } from "./quiz";

/**
 * Where a question's answers stand: right under the scene's bottom edge (`GAP_BELOW_SCENE` clear of it), the same on every
 * screen, not up from the button. A tall phone's spare room is then above the button, where it is not seen, and no screen
 * has more space between its scene and its answers than another.
 */

/** The result panel's sheet (px): it starts `OPTION.panelTop` down on a 844px stage and ends at the stage's bottom. */
const PANEL_H = 844 - OPTION.panelTop;
/** The clear space (px) between a picture drawn over the scene (a card on the screen) and the answers under it. */
export const PICTURE_GAP = 18;

/**
 * The CSS `top` of the answers, `height` px tall. Before a check they hang from the scene's bottom edge, with the picture
 * (`pictureHeight`, 0 if there is none) between if there is one; once checked the scene has risen (`lifted`) and they
 * rise with it, but never so low that the result panel covers them. They are never lower than the button row allows
 * (`underAbove`), so on a screen with no room under the scene they stand on the row and overlap it, as they always did.
 */
export function answersTop(height: number, { withHint, lifted, pictureHeight = 0 }: { withHint: boolean; lifted: boolean; pictureHeight?: number }) {
  const picture = pictureHeight > 0 ? ` + ${pictureHeight + PICTURE_GAP}px` : "";
  const hanging = underAbove(`calc(${lifted ? SCENE_BOTTOM_LIFTED : SCENE_BOTTOM} + ${GAP_BELOW_SCENE}px${picture})`, height, OPTION.aboveButtons, withHint);
  return lifted ? `min(${hanging}, calc(var(--stage-h, 844px) - ${PANEL_H}px - ${GAP_BELOW_SCENE}px - ${height}px))` : hanging;
}

/** The answers' `top` moves with the scene: the same way up and down (see `liftTransition`). */
export const answersMove = (lifted: boolean) => liftTransition("top", lifted);

/** The CSS `bottom` of what stands on the answers (a picture): `PICTURE_GAP` above `top`, a value from `answersTop`. It moves with them (see `liftTransition`). */
export const standingOn = (top: string) => `calc(var(--stage-h, 844px) - ${top} + ${PICTURE_GAP}px)`;
