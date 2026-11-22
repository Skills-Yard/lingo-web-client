"use client";

import { createContext, useContext, type ReactNode } from "react";
import { HexStandInProvider } from "@/components/level-two/HexStandIn";
import { OPTION_GAP } from "./AnswerTray";
import { CharacterAvatar } from "./CharacterAvatar";
import { SEQUENCE_STEPS, sequenceNext, sequencePrevious } from "./sequence";
import { positionOfStep, SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";

/**
 * Where a screen of the original module takes its learner next, and what its progress bar
 * shows. The original module's screens know only their own step there; the 3D flow
 * (`sequence3d.ts`) plays copies of some of them in another order, so they ask here.
 * Outside the 3D route this is the original module's own.
 */
type SequenceFlow = {
  total: number;
  /** The progress bar's place for the original module's screen `step`. */
  position: (step: number) => number;
  next: (step: number) => string;
  previous: (step: number) => string;
  /** The right answer of a quiz bounces (`RightBounce`, with its shine and stars): on the 3D route only. */
  bounceRight: boolean;
  /** Every empty drag slot (`ArrangeBoard`, `ChipList`) has the 3D design's look, and screen 12's board its 112 x 119 cards (`ArrangeScreen`): on the 3D route only. */
  designSlots: boolean;
  /** The space (px) between the rows of a list of answers: roomier on the 3D route (the design's 6 looked too close). */
  optionGap: number;
  /** A picture above a list of answers leaves (fades and slides out) when the result popup comes, so the rows that rise to clear the popup never overlap it: on the 3D route only (the 2D one pulls the picture in and keeps it). */
  clearsPictures: boolean;
};

const ORIGINAL: SequenceFlow = { total: SEQUENCE_STEPS, position: (step) => step, next: sequenceNext, previous: sequencePrevious, bounceRight: false, designSlots: false, optionGap: 6, clearsPictures: false };

const THREE_D: SequenceFlow = {
  bounceRight: true,
  designSlots: true,
  optionGap: OPTION_GAP,
  clearsPictures: true,
  total: SEQUENCE_3D_STEPS,
  position: (step) => positionOfStep(step) || step,
  next: (step) => sequence3dNext(positionOfStep(step)),
  previous: (step) => sequence3dPrevious(positionOfStep(step)),
};

const SequenceFlowContext = createContext<SequenceFlow>(ORIGINAL);

export const useSequenceFlow = () => useContext(SequenceFlowContext);

/** The 3D route's screens: the 3D flow, and the character's face where Hex stands. */
export function Sequence3dFlow({ children }: { children: ReactNode }) {
  return (
    <SequenceFlowContext.Provider value={THREE_D}>
      <HexStandInProvider value={<CharacterAvatar />}>{children}</HexStandInProvider>
    </SequenceFlowContext.Provider>
  );
}
