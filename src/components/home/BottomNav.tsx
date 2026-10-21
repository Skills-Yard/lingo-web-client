"use client";

import { motion } from "framer-motion";
import { Crown, House, MessageSquare, Plus, UserRound } from "lucide-react";

export type HomeTab = "home" | "courses" | "benefits" | "profile";

const ITEMS = [
  { id: "home", label: "Home", Icon: House },
  { id: "courses", label: "Careers", Icon: MessageSquare },
  { id: "benefits", label: "Events", Icon: Crown },
  { id: "profile", label: "Dashboard", Icon: UserRound },
] as const satisfies readonly { id: HomeTab; label: string; Icon: typeof House }[];
//check
/** The floating nav shared by the home and profile screens: a 60px pill of
 * four tabs and, beside it, a round Feed button. Only Home and Dashboard
 * (the profile) have a screen yet; the rest are inert. */
export function BottomNav({
  active,
  onNavigate,
}: {
  active: HomeTab;
  onNavigate?: (tab: HomeTab) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="pointer-events-auto flex w-[358px] max-w-full items-center gap-2.5"
    >
      <nav className="flex h-[60px] min-w-0 flex-1 items-center justify-between rounded-[44px] bg-white px-[22px] shadow-[0_1px_7.7px_rgba(0,0,0,0.25)] dark:bg-[#1c2e36]">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate?.(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-[41px] flex-col items-center justify-center transition-colors duration-200 ${
                isActive ? "text-[#00B8A9]" : "text-[#818185] dark:text-white/50"
              }`}
            >
              <Icon className="h-[27px] w-[27px]" strokeWidth={isActive ? 2.3 : 1.6} />
              <span className="text-[10px] font-medium leading-[1.4]">{label}</span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        className="flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full bg-white text-[#818185] shadow-[0_1px_7.7px_rgba(0,0,0,0.25)] dark:bg-[#1c2e36] dark:text-white/50"
      >
        <Plus className="h-[24px] w-[24px]" strokeWidth={1.6} />
        <span className="text-[10px] font-medium leading-[1.4]">Feed</span>
      </button>
    </motion.div>
  );
}
