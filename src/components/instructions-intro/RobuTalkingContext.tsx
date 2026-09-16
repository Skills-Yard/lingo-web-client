"use client";

import { createContext, useContext } from "react";

interface RobuTalkingContextValue {
  /** Ref-counted so two overlapping typewriters (e.g. Robu's own heading plus
   * a note card typing right after it) don't have the first one finishing
   * turn Robu's mouth off while the second is still going. */
  startTalking: () => void;
  stopTalking: () => void;
}

/** No-op default so a `<SpeechBubble>` rendered outside `InstructionsIntroFlow`
 * (if that ever happens) never crashes for lack of a provider — it just never
 * drives Robu's mouth. */
const noop = () => {};

export const RobuTalkingContext = createContext<RobuTalkingContextValue>({
  startTalking: noop,
  stopTalking: noop,
});

/** Lets any `<SpeechBubble>`, anywhere in the flow, report "I'm currently
 * typing" so the single shared Robu mascot (see RobuStage) can play his
 * talking-mouth overlay for exactly as long as any heading/bubble text is
 * actively animating on screen. */
export function useRobuTalking() {
  return useContext(RobuTalkingContext);
}
