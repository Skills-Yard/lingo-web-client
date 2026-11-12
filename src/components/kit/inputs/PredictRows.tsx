"use client";

import type { ComponentProps } from "react";
import { PredictTestStage, TableStage } from "../content/from-conditions/interactions";

export type { PredictRow } from "../content/from-conditions/interactions";

/**
 * `predict`: each row is a case with the answers to pick from (True or False by default); a right pick turns the
 * row green, a wrong one shakes red with the hint. Done when every row is answered.
 * `reveal`: a table whose result columns are hidden; a tap on a row shows them. Done when every row has been shown.
 */
export type PredictRowsProps = ({ look: "predict" } & ComponentProps<typeof PredictTestStage>) | ({ look: "reveal" } & ComponentProps<typeof TableStage>);

/**
 * Results worked out row by row: the one component for it, in the look the data asks for (see
 * `PredictRowsProps`). It tells the screen through `api` (`slip` for a miss, `done` when finished).
 */
export function PredictRows(props: PredictRowsProps) {
  if (props.look === "predict") {
    const { look, ...rest } = props;
    void look;
    return <PredictTestStage {...rest} />;
  }
  const { look, ...rest } = props;
  void look;
  return <TableStage {...rest} />;
}
