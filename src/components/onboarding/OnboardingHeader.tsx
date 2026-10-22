"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Maximize, Minimize, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { PersistentProgressBar } from "@/components/ui/PersistentProgressBar";

/** The theme switch's wipe colours — each theme's onboarding background
 * (`--background` in globals.css, `.onboarding-light` and its dark override). */
export const WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

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
  /** Unused now: sound lives in the hidden dev panels. */
  muted?: boolean;
  onToggleMuted?: () => void;
  /** The Level 1 header: no sound button, the light / dark switch moves up
   * beside the full screen icon, and the battery sits right of the bar. */
  level?: boolean;
}

// The step the progress bar last showed. Each screen mounts a fresh header,
// so this is what lets the fill start from where it was — growing when the
// user moves forward, shrinking back when they return to an earlier question.
let lastShown: { step: number; total: number } | null = null;

export function OnboardingHeader({ onBack, progress, answer, showCount, level }: OnboardingHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const fullscreen = useFullscreen();
  // The Level 1 dev panel (opened from the battery) and its click-away.
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelOpen) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      setPanelOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [panelOpen]);
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
        className={`absolute left-4 ${level ? "top-[6px]" : "top-[43.5px]"} ${ICON_BUTTON}`}
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
            className={`absolute left-[67px] mx-auto max-w-[480px] -translate-y-1/2 ${level ? "top-[25.5px] right-[67px]" : "top-[63px] right-4"}`}
          />
        </>
      )}

      {/* Hidden where it can't do anything (iPhone Safari, installed PWA).
          Sits in the top-right corner so the bar keeps one width either way. */}
      {level && (
        // The battery is also the way into a hidden dev panel: nothing about it
        // looks pressable (no pointer, hover or focus ring).
        <div ref={panelRef} className="absolute top-[6px] right-4">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setPanelOpen((open) => !open)}
            className="flex h-[39px] w-[39px] cursor-default items-center justify-center rounded-md border border-black/8 outline-none select-none dark:border-white/15"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/level-one/battery.png" alt="" draggable={false} className="h-[15px] w-[30px] select-none" />
          </button>
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                role="dialog"
                aria-label="Developer testing panel"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "100% 0%" }}
                className="absolute top-[45px] right-0 z-30 w-[220px] rounded-xl border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
              >
                <p className="text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">
                  For testing by devs only. Temporary.
                </p>
                <button
                  type="button"
                  onClick={() => toggleTheme(WIPE)}
                  className="mt-2.5 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#2C2C2C] active:scale-[0.98] dark:bg-[#16262D] dark:text-white"
                >
                  {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                  {dark ? "Switch to light mode" : "Switch to dark mode"}
                </button>
                {fullscreen.available && (
                  <button
                    type="button"
                    onClick={fullscreen.toggle}
                    className="mt-2 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#2C2C2C] active:scale-[0.98] dark:bg-[#16262D] dark:text-white"
                  >
                    {fullscreen.active ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    {fullscreen.active ? "Exit full screen" : "Full screen"}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </header>
  );
}
