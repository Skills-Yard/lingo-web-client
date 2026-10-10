"use client";

import { motion } from "framer-motion";
import { Crown, House, Monitor, UserRound } from "lucide-react";

export type HomeTab = "home" | "courses" | "benefits" | "profile";

const ITEMS = [
  { id: "home", label: "Home", Icon: House },
  { id: "courses", label: "Courses", Icon: Monitor },
  { id: "benefits", label: "Benefits", Icon: Crown },
  { id: "profile", label: "Profile", Icon: UserRound },
] as const satisfies readonly { id: HomeTab; label: string; Icon: typeof House }[];

/** The floating pill nav shared by the home and profile screens (Figma
 * "Frame 148": 358x60, 44px radius). Only Home and Profile have a screen
 * yet; the other two are inert. */
export function BottomNav({
  active,
  onNavigate,
}: {
  active: HomeTab;
  onNavigate?: (tab: HomeTab) => void;
}) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="pointer-events-auto flex h-[60px] w-[358px] max-w-full items-center justify-between gap-[18px] rounded-[44px] bg-white px-[38px] py-3 shadow-[0_1px_7.7px_rgba(0,0,0,0.25)]"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate?.(id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-[41px] flex-col items-center justify-center transition-colors duration-200 ${
              isActive ? "text-[#00B8A9]" : "text-[#818185]"
            }`}
          >
            <Icon className="h-[27px] w-[27px]" strokeWidth={isActive ? 2.3 : 1.6} />
            <span className="text-[10px] font-medium leading-[1.4]">{label}</span>
          </button>
        );
      })}
    </motion.nav>
  );
}
