"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { HexStandInProvider } from "@/components/level-two/HexStandIn";
import { BatteryTapProvider } from "@/components/onboarding/batteryTap";
import { CharacterAvatar } from "./CharacterAvatar";
import { MentorPicker } from "./MentorPicker";
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
};

const ORIGINAL: SequenceFlow = { total: SEQUENCE_STEPS, position: (step) => step, next: sequenceNext, previous: sequencePrevious };

const THREE_D: SequenceFlow = {
  total: SEQUENCE_3D_STEPS,
  position: (step) => positionOfStep(step) || step,
  next: (step) => sequence3dNext(positionOfStep(step)),
  previous: (step) => sequence3dPrevious(positionOfStep(step)),
};

const SequenceFlowContext = createContext<SequenceFlow>(ORIGINAL);

export const useSequenceFlow = () => useContext(SequenceFlowContext);

/**
 * The 3D route's screens: the 3D flow, the character's face where Hex stands, and the mentor
 * picker that a tap on the battery opens (instead of the Energy screen).
 */
export function Sequence3dFlow({ children }: { children: ReactNode }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  return (
    <SequenceFlowContext.Provider value={THREE_D}>
      <HexStandInProvider value={<CharacterAvatar />}>
        <BatteryTapProvider value={openPicker}>
          {children}
          <MentorPicker open={pickerOpen} onClose={closePicker} />
        </BatteryTapProvider>
      </HexStandInProvider>
    </SequenceFlowContext.Provider>
  );
}
