"use client";

import { useSyncExternalStore } from "react";
import { STEP } from "./sequence";
import { struggled } from "./sequenceScore";
import { PredictScreen, type PredictVariant } from "./PredictScreen";

const subscribeNever = () => () => {};
const variantNow = (): PredictVariant => (struggled(STEP.predict) ? "simpler" : "longer");

/**
 * The prediction that follows "Think before you move!": a longer sequence for a
 * learner who got that one right with no help, a simpler one for anyone who
 * missed it or used the hint. Read in the browser (the server can't tell, and
 * says "longer"): the screen is remade if the two differ.
 */
export function PredictFollowUpScreen() {
  const variant = useSyncExternalStore(subscribeNever, variantNow, () => "longer" as const);
  return <PredictScreen key={variant} variant={variant} />;
}
