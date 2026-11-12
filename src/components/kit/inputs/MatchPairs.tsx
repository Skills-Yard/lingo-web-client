"use client";

import type { ComponentProps } from "react";
import { MatchStage } from "../content/from-variable/interactions";

export type { MatchCard, MatchPlace, MatchScene } from "../content/from-variable/interactions";

/**
 * `places` are the things the cards go on (a product with its price tag); `cards` are what is dragged (a name),
 * each belonging on the place with the same `id`. The words (`narration`, `idle`, `wrong`, `finishedNote`) are
 * the data's. `scene` lets the scene behind the screen follow along.
 */
export type MatchPairsProps = ComponentProps<typeof MatchStage>;

/**
 * Match items in pairs: drag each card onto the place it belongs to. When every place has a card it is checked:
 * all right and the screen is told (`api.done`); otherwise it counts as a miss (`api.slip`) and the cards go back.
 */
export function MatchPairs(props: MatchPairsProps) {
  return <MatchStage {...props} />;
}
