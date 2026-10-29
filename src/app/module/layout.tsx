import { HexRiveGate } from "@/components/rive/HexRiveGate";
import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";
import { RobotWarmup } from "@/components/rive/RobotWarmup";

/** Level screens share the progress bar and Hex canvases of `hex.riv`, one Continue button and the robot of `command.riv`. */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleButtonWarmup />
      <RobotWarmup />
      <HexRiveGate>{children}</HexRiveGate>
    </>
  );
}
