import { HexRiveGate } from "@/components/rive/HexRiveGate";
import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";
import { RobotWarmup } from "@/components/rive/RobotWarmup";
import { ForcedTheme } from "@/context/ThemeContext";

/** Level screens share the Hex canvases of `hex.riv`, the progress bar of `progressBar.riv`, one Continue button and the robot of `command.riv`.
 * The module is light only for now, whatever theme the learner has chosen. */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ForcedTheme theme="light">
      <ModuleButtonWarmup />
      <RobotWarmup />
      <HexRiveGate>{children}</HexRiveGate>
    </ForcedTheme>
  );
}
