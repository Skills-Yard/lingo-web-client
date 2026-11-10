"use client";

import type { ComponentProps } from "react";
import { GroupStage } from "../content/from-datatypes/GroupStage";
import { SortStage } from "../content/from-datatypes/interactions";
import { LabelStage } from "../content/from-variable/interactions";

export type { SortApi } from "../content/from-datatypes/screen";
export type { GroupItem } from "../content/from-datatypes/GroupStage";
export type { SortItem, SortBucket } from "../content/from-datatypes/interactions";
export type { LabelItem, LabelChoice } from "../content/from-variable/interactions";

/**
 * `columns`: cards are dragged (or tapped, then the group) into group boxes; a wrong drop shakes and gives its hint.
 * `free`: grouping with no right answer: the cards go into whichever of three columns the learner likes.
 * `labels`: tap a part, then press the label it has ("It is a name" / "It is a value").
 */
export type SortGroupsProps =
  | ({ look: "columns" } & ComponentProps<typeof SortStage>)
  | ({ look: "free" } & ComponentProps<typeof GroupStage>)
  | ({ look: "labels" } & ComponentProps<typeof LabelStage>);

/**
 * Putting things into groups: the one component for every sorting activity, in the look the data asks for
 * (see `SortGroupsProps`). Each look is done when everything is in its group, and tells the screen through
 * `api` (`slip` for a miss, `done` when finished).
 */
export function SortGroups(props: SortGroupsProps) {
  switch (props.look) {
    case "columns": {
      const { look, ...rest } = props;
      void look;
      return <SortStage {...rest} />;
    }
    case "free": {
      const { look, ...rest } = props;
      void look;
      return <GroupStage {...rest} />;
    }
    case "labels": {
      const { look, ...rest } = props;
      void look;
      return <LabelStage {...rest} />;
    }
  }
}
