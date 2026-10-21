import { HexRiveGate } from "@/components/rive/HexRiveGate";

/** Level screens share the progress bar and Hex canvases of `hex.riv`. */
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <HexRiveGate>{children}</HexRiveGate>;
}
