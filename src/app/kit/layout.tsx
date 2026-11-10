import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";
import { RobotWarmup } from "@/components/rive/RobotWarmup";

/** The kit's pages need what lesson screens need: the Continue button and the robot, loaded before they draw. The `.riv` files themselves are already loaded by the root layout's `RiveAssetsGate`. */
export default function KitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleButtonWarmup />
      <RobotWarmup />
      {children}
    </>
  );
}
