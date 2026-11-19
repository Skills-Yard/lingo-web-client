import { HomeShell } from "@/features/home";

/** The home's tabs share one bottom nav (see HomeShell). */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>;
}
