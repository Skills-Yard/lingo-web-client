"use client";

import type { ComponentProps } from "react";
import { PairUpStage } from "../content/from-conditions/interactions";
import { GroupTourStage } from "../content/from-datatypes/GroupTourStage";
import { RevealStage } from "../content/from-datatypes/interactions";
import { FlipCarouselStage } from "../content/from-operators/FlipCarousel";
import { ScenesStage } from "../content/from-operators/interactions";
import { JobTurnStage, OperatorTurnStage } from "../content/from-operators/OperatorCardsStage";
import { SituationsStage } from "../content/from-operators/SituationsStage";

export type { RevealItem } from "../content/from-datatypes/interactions";
export type { TourGroup } from "../content/from-datatypes/GroupTourStage";
export type { SceneItem } from "../content/from-operators/interactions";
export type { JobItem, OperatorItem } from "../content/from-operators/OperatorCardsStage";
export type { SituationItem } from "../content/from-operators/SituationsStage";

/**
 * Cards the learner goes through one by one, each showing what it means. The looks:
 *
 * Tapped by the learner (done when all have been tapped):
 *   `cards`       small tinted cards (a picture, a name); the meaning of the one tapped shows under them
 *   `scenes`      picture cards with a round badge; a line under them says what is going on
 *   `share`       numbers to tap; each shows its objects shared into two groups, and what is left over
 *   `flip`        a carousel of cards that turn over
 *
 * Introduced by Hex, one per stage (`focus` is the card whose turn it is; Continue goes on):
 *   `situations`  a grid of situations
 *   `operators`   a grid of operators, each a symbol on a key, with an example under the grid
 *   `jobs`        a grid of jobs, each a picture, with an example under the grid
 *   `tour`        groups of cards walked through with Continue
 */
export type RevealCardsProps =
  | ({ look: "cards" } & ComponentProps<typeof RevealStage>)
  | ({ look: "scenes" } & ComponentProps<typeof ScenesStage>)
  | ({ look: "share" } & ComponentProps<typeof PairUpStage>)
  | ({ look: "flip" } & ComponentProps<typeof FlipCarouselStage>)
  | ({ look: "situations" } & ComponentProps<typeof SituationsStage>)
  | ({ look: "operators" } & ComponentProps<typeof OperatorTurnStage>)
  | ({ look: "jobs" } & ComponentProps<typeof JobTurnStage>)
  | ({ look: "tour" } & ComponentProps<typeof GroupTourStage>);

/**
 * Showing what each of a set of cards means: the one component for every "tap each card" and
 * "meet them one by one" activity, in the look the data asks for (see `RevealCardsProps`). It tells
 * the screen through `api` when every card has been seen.
 */
export function RevealCards(props: RevealCardsProps) {
  switch (props.look) {
    case "cards": {
      const { look, ...rest } = props;
      void look;
      return <RevealStage {...rest} />;
    }
    case "scenes": {
      const { look, ...rest } = props;
      void look;
      return <ScenesStage {...rest} />;
    }
    case "share": {
      const { look, ...rest } = props;
      void look;
      return <PairUpStage {...rest} />;
    }
    case "flip": {
      const { look, ...rest } = props;
      void look;
      return <FlipCarouselStage {...rest} />;
    }
    case "situations": {
      const { look, ...rest } = props;
      void look;
      return <SituationsStage {...rest} />;
    }
    case "operators": {
      const { look, ...rest } = props;
      void look;
      return <OperatorTurnStage {...rest} />;
    }
    case "jobs": {
      const { look, ...rest } = props;
      void look;
      return <JobTurnStage {...rest} />;
    }
    case "tour": {
      const { look, ...rest } = props;
      void look;
      return <GroupTourStage {...rest} />;
    }
  }
}
