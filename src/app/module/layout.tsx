import { CelebrationProvider } from "@/components/level-one/Celebration";
import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";
import { RobotWarmup } from "@/components/rive/RobotWarmup";

/** Level screens share the Hex canvases of `hex.riv`, the progress bar of `progressBar.riv`, one Continue button and the robot of `command.riv`. All of those files are already loaded by the root layout's `RiveAssetsGate`. */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleButtonWarmup />
      <RobotWarmup />
      <CelebrationProvider>{children}</CelebrationProvider>
    </>
  );
}
