"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/** The theme switch's wipe colours — each theme's onboarding background
 * (`--background` in globals.css, `.onboarding-light` and its dark override). */
const WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

/** Back, light/dark and sound share one look — same size, same weight. */
const ICON_BUTTON =
  "w-10 h-10 flex items-center justify-center rounded-full text-[#1A1C22]/70 hover:bg-black/5 transition-all active:scale-95 cursor-pointer dark:text-white/70 dark:hover:bg-white/10";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** Question screens show the step progress (reference screens 8-14); the
   * connector screens between them (foxy intro, ready-check, notification
   * permission) don't — there's nothing to show progress *of* there. */
  progress?: { step: number; total: number };
  muted: boolean;
  onToggleMuted: () => void;
}

export function OnboardingHeader({ onBack, progress, muted, onToggleMuted }: OnboardingHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <header className="shrink-0 flex items-center justify-between gap-2.5 px-4 pt-3 pb-2 select-none">
      <button type="button" onClick={onBack} className={`shrink-0 ${ICON_BUTTON}`} aria-label="Back">
        <ChevronLeft className="w-5 h-5" />
      </button>

      {progress && (
        <div className="flex-1 px-2 md:mx-auto md:max-w-xs">
          <p className="mb-1 text-xs font-semibold tabular-nums text-primary">
            {String(progress.step).padStart(2, "0")}/{String(progress.total).padStart(2, "0")}
          </p>
          {/* One continuous track. Each question's header mounts fresh with
              its screen, so the fill starts at the previous question's
              length and grows to this one's. */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: `${((progress.step - 1) / progress.total) * 100}%` }}
              animate={{ width: `${(progress.step / progress.total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center">
        {/* Light/dark switch — the site's own theme (see ThemeContext),
            wiped in diagonally from the top-right corner. */}
        <button
          type="button"
          onClick={() => toggleTheme(WIPE)}
          className={`${ICON_BUTTON} dark:text-amber-400`}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <Sun key="sun" className="w-5 h-5 animate-[spinIn_0.45s_cubic-bezier(0.4,0,0.2,1)]" />
          ) : (
            <Moon key="moon" className="w-5 h-5 animate-[spinIn_0.45s_cubic-bezier(0.4,0,0.2,1)]" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleMuted}
          className={ICON_BUTTON}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
