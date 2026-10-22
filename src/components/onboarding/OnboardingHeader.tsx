"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Maximize, Minimize, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";

/** The theme switch's wipe colours — each theme's onboarding background
 * (`--background` in globals.css, `.onboarding-light` and its dark override). */
const WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

/** Back, full screen, light/dark and sound share one look — same size, same weight. */
const ICON_BUTTON =
  "w-[39px] h-[39px] flex items-center justify-center rounded-md border border-black/8 text-[#444444] transition-all active:scale-95 cursor-pointer dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** Question screens show the step progress (reference screens 8-14); the
   * connector screens between them (foxy intro, ready-check, notification
   * permission) don't — there's nothing to show progress *of* there. */
  progress?: { step: number; total: number };
  /** The latest checked answer — plays the bar's correct / wrong reaction. */
  answer?: AnswerResult | null;
  /** Shows "step/total" above the bar. */
  showCount?: boolean;
  muted: boolean;
  onToggleMuted: () => void;
}

// The step the progress bar last showed. Each screen mounts a fresh header,
// so this is what lets the fill start from where it was — growing when the
// user moves forward, shrinking back when they return to an earlier question.
let lastShown: { step: number; total: number } | null = null;

export function OnboardingHeader({ onBack, progress, answer, showCount, muted, onToggleMuted }: OnboardingHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const fullscreen = useFullscreen();
  const [fromStep] = useState(() => (progress ? (lastShown?.step ?? progress.step - 1) : null));
  useEffect(() => {
    if (progress) lastShown = { step: progress.step, total: progress.total };
  }, [progress]);
  return (
    // Fixed 83px box, placed from the top edge: page count at 27px, bar at
    // 63px, and the 39px buttons centred on the bar (43.5px). The bar always
    // runs between back and the two right buttons — one width on every screen.
    <header className="relative h-[83px] shrink-0 select-none">
      <button
        type="button"
        onClick={onBack}
        className={`absolute top-[43.5px] left-4 ${ICON_BUTTON}`}
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.4} />
      </button>

      {progress && (
        <>
          {showCount && (
            <span className="absolute top-[27px] left-1/2 -translate-x-1/2 text-[14px] leading-none font-medium whitespace-nowrap text-[#888888] tabular-nums dark:text-white/60">
              <span className="text-[#00B8A9]">{String(progress.step).padStart(2, "0")}</span>/
              {String(progress.total).padStart(2, "0")}
            </span>
          )}
          {/* Rive draws the bar; it animates to the new fill itself. It ends
              12px short of the right-hand buttons — three of them when full
              screen is offered. */}
          <PersistentProgressBar
            value={(progress.step / progress.total) * 100}
            from={(((fromStep ?? progress.step - 1)) / progress.total) * 100}
            answer={answer}
            className="absolute left-[67px] right-[114px] top-[63px] mx-auto max-w-[480px] -translate-y-1/2"
          />
        </>
      )}

      {/* Hidden where it can't do anything (iPhone Safari, installed PWA).
          Sits in the top-right corner so the bar keeps one width either way. */}
      {fullscreen.available && (
        <button
          type="button"
          onClick={fullscreen.toggle}
          className="absolute top-0.5 right-4 flex h-5 w-5 cursor-pointer items-center justify-center text-[#444444] transition-all active:scale-95 dark:text-white/70"
          aria-label={fullscreen.active ? "Exit full screen" : "Enter full screen"}
        >
          {fullscreen.active ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      )}

      <div className="absolute top-[43.5px] right-4 flex items-center gap-2">
        {/* Light/dark switch and sound keep their places. */}
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
