"use client";

import type { ComponentProps } from "react";
import { ComboStage } from "../content/from-conditions/interactions";
import { ToggleStage } from "../content/from-datatypes/interactions";

export type { ComboInput } from "../content/from-conditions/interactions";
export type { ToggleItem } from "../content/from-datatypes/interactions";

/**
 * `combinations`: each input is switched on or off by a tap, and the learner says whether the requirement is
 * satisfied (AND / OR / NOT); done once every combination has been answered.
 * `switches`: each picture is switched between its two states; done once each has been switched.
 */
export type SwitchTableProps = ({ look: "combinations" } & ComponentProps<typeof ComboStage>) | ({ look: "switches" } & ComponentProps<typeof ToggleStage>);

/**
 * Flip switches and see what comes of it: the one component for it, in the look the data asks for
 * (see `SwitchTableProps`). It tells the screen through `api` (`slip` for a miss, `done` when finished).
 */
export function SwitchTable(props: SwitchTableProps) {
  if (props.look === "combinations") {
    const { look, ...rest } = props;
    void look;
    return <ComboStage {...rest} />;
  }
  const { look, ...rest } = props;
  void look;
  return <ToggleStage {...rest} />;
}
