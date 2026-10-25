"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Maximize, Minimize, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { WIPE } from "./OnboardingHeader";
import { useTripleTap } from "./tripleTap";

/*
 * TEMPORARY — FOR DEVS ONLY. REMOVE BEFORE RELEASE.
 * A hidden testing panel (back, theme, sound, full screen) that opens when Hex is
 * tapped. There is a twin on the Level 1 header (the battery, see
 * OnboardingHeader). Nothing on screen hints that they exist, and it takes
 * three taps on Hex in a row to open.
 */

const BUTTON =
  "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg bg-[#F7F8FA] px-3 text-[13px] font-medium text-[#2C2C2C] active:scale-[0.98] dark:bg-[#16262D] dark:text-white";

/** Is the point inside Hex's box? Boxes are marked by his canvas (`data-hex`)
 * or, where his canvas bleeds past it, by `data-hex-box`. */
const hexAt = (x: number, y: number) =>
  [...document.querySelectorAll<HTMLElement>("canvas[data-hex]")].some((canvas) => {
    if (getComputedStyle(canvas).visibility === "hidden") return false;
    const box = (canvas.closest("[data-hex-box]") as HTMLElement | null) ?? canvas;
    const r = box.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });

export function DevPanel({
  muted,
  onToggleMuted,
  onBack,
}: {
  muted: boolean;
  onToggleMuted: () => void;
  /** Goes back a screen; left out where there is nothing to go back from. */
  onBack?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const fullscreen = useFullscreen();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const openRef = useRef(false);
  openRef.current = open;
  const { tap, reset } = useTripleTap(() => setOpen(true));

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-dev-panel]")) return;
      // Open: any tap outside closes it. Closed: only Hex counts, three in a row.
      if (openRef.current) {
        setOpen(false);
        reset();
      } else if (hexAt(e.clientX, e.clientY)) tap();
      else reset();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [tap, reset]);

  if (!mounted) return null;
  const dark = theme === "dark";
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-dev-panel
          role="dialog"
          aria-label="Developer testing panel"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "100% 0%" }}
          className="fixed top-14 right-4 z-[2147483647] flex w-[220px] flex-col gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
        >
          <p className="text-[11px] leading-[15px] text-[#818185] dark:text-[#9FA19F]">For testing by devs only. Temporary.</p>
          {onBack && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
                onBack();
              }}
              className={BUTTON}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button type="button" onClick={() => toggleTheme(WIPE)} className={BUTTON}>
            {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            {dark ? "Switch to light mode" : "Switch to dark mode"}
          </button>
          <button type="button" onClick={onToggleMuted} className={BUTTON}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Unmute" : "Mute"}
          </button>
          {fullscreen.available && (
            <button type="button" onClick={fullscreen.toggle} className={BUTTON}>
              {fullscreen.active ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              {fullscreen.active ? "Exit full screen" : "Full screen"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
