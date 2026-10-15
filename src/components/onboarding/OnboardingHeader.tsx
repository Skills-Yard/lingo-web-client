"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/** The theme switch's wipe colours — each theme's onboarding background
 * (`--background` in globals.css, `.onboarding-light` and its dark override). */
const WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

/** Back, light/dark and sound share one look — same size, same weight. */
const ICON_BUTTON =
  "w-[39px] h-[39px] flex items-center justify-center rounded-md border border-black/8 text-[#444444] transition-all active:scale-95 cursor-pointer dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** Question screens show the step progress (reference screens 8-14); the
   * connector screens between them (foxy intro, ready-check, notification
   * permission) don't — there's nothing to show progress *of* there. */
  progress?: { step: number; total: number };
  muted: boolean;
  onToggleMuted: () => void;
}

// The step the progress bar last showed. Each screen mounts a fresh header,
// so this is what lets the fill start from where it was — growing when the
// user moves forward, shrinking back when they return to an earlier question.
let lastShownStep: number | null = null;

export function OnboardingHeader({ onBack, progress, muted, onToggleMuted }: OnboardingHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [fromStep] = useState(() => {
    if (!progress) return null;
    return lastShownStep ?? progress.step - 1;
  });
  // Questions share one screen, so this header can outlive a step change.
  useEffect(() => {
    if (progress) lastShownStep = progress.step;
  }, [progress]);
  return (
    // Fixed 107px box, placed from the top edge: page count at 51px, bar at
    // 81px, and the 39px buttons centred on the bar (67.5px).
    <header className="relative h-[107px] shrink-0 select-none">
      <button
        type="button"
        onClick={onBack}
        className={`absolute top-[67.5px] left-4 ${ICON_BUTTON}`}
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.4} />
      </button>

      {progress && (
        <>
          {/* Page count: centred between the buttons, 51px from the top. */}
          <p className="absolute top-[51px] left-1/2 -translate-x-1/2 text-sm leading-[14px] font-medium tabular-nums text-[#2C2C2C] dark:text-white">
            <span className="bg-linear-to-r from-[#00B8A9] via-[#0A9EAE] to-[#1287B3] bg-clip-text text-transparent">
              {String(progress.step).padStart(2, "0")}
            </span>
            /{String(progress.total).padStart(2, "0")}
          </p>
          {/* One continuous track. Each question's header mounts fresh with
              its screen, so the fill starts at the previous question's
              length and grows to this one's. */}
          <div className="absolute left-[67px] right-[114px] top-[81px] h-3 overflow-hidden rounded-full bg-black/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:bg-white/15">
            {/* The fill keeps a flat right edge while unfinished — it only
                rounds off once the bar is full. */}
            <motion.div
              className={`relative h-full overflow-hidden rounded-l-full bg-linear-to-r from-[#00B8A9] via-[#0A9EAE] to-[#1287B3] shadow-[0_0_10px_rgba(0,184,169,0.55)] ${
                progress.step >= progress.total ? "rounded-r-full" : ""
              }`}
              initial={{ width: `${((fromStep ?? progress.step - 1) / progress.total) * 100}%` }}
              animate={{ width: `${(progress.step / progress.total) * 100}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              {/* Glossy shine: a soft light stripe along the top of the fill. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-1.5 top-0.5 h-0.75 rounded-full bg-white/50"
              />
              {/* Sweeping highlight that loops across the fill. */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: "-120%" }}
                animate={{ x: "380%" }}
                transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
              />
              {/* Bright leading edge. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-0.75 bg-white/70"
              />
            </motion.div>
          </div>
        </>
      )}

      <div className="absolute top-[67.5px] right-4 flex items-center gap-2">
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
