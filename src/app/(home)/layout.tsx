import { HexRiveGate } from "@/components/rive/HexRiveGate";
import { HomeShell } from "@/components/home/HomeShell";

/** The home's tabs share one bottom nav (see HomeShell). */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <HexRiveGate>
      <HomeShell>{children}</HomeShell>
    </HexRiveGate>;
}
