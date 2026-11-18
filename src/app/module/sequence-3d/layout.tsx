import { Sequence3dAssetsGate } from "@/components/sequence/Sequence3dAssetsGate";

/** The 3D copies of the Sequence screens: a loading bar loads all they use before the first of them shows. */
export default function Sequence3dLayout({ children }: { children: React.ReactNode }) {
  return <Sequence3dAssetsGate>{children}</Sequence3dAssetsGate>;
}
