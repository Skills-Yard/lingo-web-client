"use client";

import type { ComponentProps } from "react";
import { ExpressionStage } from "../content/from-operators/interactions";

/**
 * `tokens` are the blocks, in the order they are shown; `accept` is every way of writing it that is right;
 * `hint` shows after a wrong one; `lead` stands above the blocks and `result` shows once it is right.
 */
export type BlockBuilderProps = ComponentProps<typeof ExpressionStage>;

/**
 * Build an expression or a condition from blocks: tap a block to put it in the next place, tap one in the
 * expression to take it back out. When every place is filled it is checked: a right one turns green (and
 * the screen is told through `api.done`), a wrong one shakes red with the hint (`api.slip`) and starts again.
 */
export function BlockBuilder(props: BlockBuilderProps) {
  return <ExpressionStage {...props} />;
}
