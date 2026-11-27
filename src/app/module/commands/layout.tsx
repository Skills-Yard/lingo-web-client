import { CharacterFace } from "@/components/sequence/sequenceFlow";
import { VariableCharacterGate } from "@/components/variable/VariableCharacterGate";

/**
 * The Command module's screens, with the chosen 3D character: its face (in a small box, with Hex's speech bubble beside it) stands where Hex
 * stood beside his bubbles (screens 2, 4, 5, 7, 8), and the character itself is on the title screen (`?step=0`) and screens 3, 9 and 11. The
 * gate loads it (and draws its canvas's first frames, behind a loading bar) before the first screen shows, so no screen waits for it. The
 * robot, the result panel's Hex and Level 1's screens (12-16) are as they were: `CharacterFace` swaps only the bubbles' Hex, not the rest
 * of the 3D flow's look (`CharacterLook`).
 */
export default function CommandsLayout({ children }: { children: React.ReactNode }) {
  return (
    <VariableCharacterGate>
      <CharacterFace>{children}</CharacterFace>
    </VariableCharacterGate>
  );
}
