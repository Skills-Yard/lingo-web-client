import { CharacterFace } from "@/components/sequence/sequenceFlow";
import { VariableCharacterGate } from "@/components/variable/VariableCharacterGate";

/**
 * The Data Types module's screens, with the chosen 3D character: its face (in a small box, with Hex's speech bubble beside it) stands where Hex
 * stood beside his bubbles, and the character itself is on the title screen (`?step=0`). The gate loads it (and draws its canvas's first frames,
 * behind a loading bar) before the first screen shows, so no screen waits for it. The result panel's Hex and the "Lesson complete" robot are as
 * they were; `CharacterFace` swaps only the bubbles' Hex, not the rest of the 3D flow's look (`CharacterLook`: bounce, design slots, its own
 * next / previous), which this module keeps its own of.
 */
export default function DataTypesLayout({ children }: { children: React.ReactNode }) {
  return (
    <VariableCharacterGate>
      <CharacterFace>{children}</CharacterFace>
    </VariableCharacterGate>
  );
}
