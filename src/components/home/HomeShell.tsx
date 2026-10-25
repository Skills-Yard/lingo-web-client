"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HomeNav, type HomeNavTab } from "./HomeNav";
import { HomeTopBar } from "./HomeTopBar";
import { NAV_MARGIN } from "./HomeStage";


/** Where each tab of the bottom nav goes; the rest are inert for now. */
const TAB_PATH: Partial<Record<HomeNavTab, string>> = {
  home: "/home",
  career: "/careers",
  events: "/events",
  feed: "/feed",
  dashboard: "/dashboard",
};

const tabAt = (pathname: string): HomeNavTab | null =>
  (Object.keys(TAB_PATH) as HomeNavTab[]).find((tab) => TAB_PATH[tab] === pathname) ?? null;

/**
 * The layout of the home's tabs (`/home`, `/careers`): the page, and the bottom
 * nav over it. The nav lives here rather than in each page, so it stays mounted
 * — and in place — while the pages change under it.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const active = tabAt(pathname) ?? "home";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white dark:bg-[#0F1F26]">
      {children}
      {pathname !== "/home" && pathname !== "/level" && pathname !== "/careers" && pathname !== "/feed" && <HomeTopBar />}
      {/* The level map has no nav: its own Home button lives in the screen. */}
      {pathname === "/level" ? null : (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] px-3"
          style={{ paddingBottom: NAV_MARGIN }}
        >
          <div className="pointer-events-auto">
            <HomeNav
              active={active}
              onNavigate={(tab) => {
                const path = TAB_PATH[tab];
                if (path && tab !== active) router.push(path);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
