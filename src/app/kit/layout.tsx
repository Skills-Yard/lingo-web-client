import { HexRiveGate } from "@/components/rive/HexRiveGate";
import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";
import { RobotWarmup } from "@/components/rive/RobotWarmup";

/** The kit's pages need what lesson screens need: the shared Hex file, the Continue button and the robot, loaded before they draw. */
export default function KitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleButtonWarmup />
      <RobotWarmup />
      <HexRiveGate>{children}</HexRiveGate>
    </>
  );
}
