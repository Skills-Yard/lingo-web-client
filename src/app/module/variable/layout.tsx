import { CharacterLook } from "@/components/sequence/sequenceFlow";
import { VariableCharacterGate } from "@/components/variable/VariableCharacterGate";

/** The Variable module's screens, with the chosen 3D character where Hex stood (a loading bar loads it before the first screen shows). */
export default function VariableLayout({ children }: { children: React.ReactNode }) {
  return (
    <VariableCharacterGate>
      <CharacterLook>{children}</CharacterLook>
    </VariableCharacterGate>
  );
}
