"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { House } from "lucide-react";
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
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const active = tabAt(pathname) ?? "home";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white dark:bg-[#0F1F26]">
      {children}
      {pathname !== "/home" && pathname !== "/level" && <HomeTopBar />}
      {pathname === "/level" ? (
        // The level map has no nav: just a way back home, bottom left.
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] px-4"
          style={{ paddingBottom: NAV_MARGIN + 14 }}
        >
          {/* Floats: a slow bob, with its shadow breathing along with it. */}
          <motion.button
            type="button"
            onClick={() => router.push("/home")}
            aria-label="Home"
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            whileTap={{ scale: 0.94 }}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-black bg-[#1A1C22] text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] dark:border-white dark:bg-white dark:text-[#1A1C22] dark:shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
          >
            <House className="h-7 w-7" strokeWidth={1.65} />
          </motion.button>
        </div>
      ) : (
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
