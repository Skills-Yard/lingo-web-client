import { HexRiveGate } from "@/components/rive/HexRiveGate";
import { ModuleButtonWarmup } from "@/components/rive/ModuleButtonWarmup";

/** Level screens share the progress bar and Hex canvases of `hex.riv`, and one Continue button. */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModuleButtonWarmup />
      <HexRiveGate>{children}</HexRiveGate>
    </>
  );
}
