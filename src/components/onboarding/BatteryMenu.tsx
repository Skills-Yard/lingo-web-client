"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Infinity as InfinityIcon, Maximize, Minimize, Moon, Sun } from "lucide-react";
import { setBatteryUnlimited, useBattery } from "@/components/home/batteryStore";
import { useTheme } from "@/context/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { energyHref } from "@/lib/routes";
import { WIPE } from "./themeWipe";

const BUTTON =
  "mt-2 flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg bg-[#F7F8FA] px-3 text-[16px] font-medium text-[#2C2C2C] active:scale-[0.98] dark:bg-[#16262D] dark:text-white";

/** How long the battery is held before the dev panel opens. */
const HOLD_MS = 600;

type BatteryMenuProps = {
  /** The battery itself — tapping it opens `/energy`, holding it the dev panel. */
  children: ReactNode;
  /** Sizes and places the wrapper, which must be positioned (`absolute` or
   * `relative`): the panel opens under it, right-aligned. */
  className?: string;
  /** Styles the pressable around `children`. */
  buttonClassName?: string;
  /** Adds a Back option to the panel. */
  onBack?: () => void;
};

/**
 * A tap on the battery opens the Energy screen. TEMPORARY — FOR DEVS ONLY: a
 * hold opens a hidden testing panel (theme, full screen, infinite battery);
 * nothing about it looks pressable (no pointer, hover or focus ring).
 */
export function BatteryMenu({ children, className = "", buttonClassName = "", onBack }: BatteryMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const fullscreen = useFullscreen();
  const { unlimited } = useBattery();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Where the panel opens: under the battery, right-aligned (fixed, in viewport px).
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const router = useRouter();
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);

  const startHold = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      setOpen(true);
    }, HOLD_MS);
  };
  const cancelHold = () => clearTimeout(holdTimer.current);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && (ref.current?.contains(e.target) || panelRef.current?.contains(e.target))) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className={className}>
      <button
        type="button"
        tabIndex={-1}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          if (open) return setOpen(false);
          router.push(energyHref(window.location.pathname + window.location.search));
        }}
        // A hold must open the panel, not the browser's long-press menu.
        onContextMenu={(e) => e.preventDefault()}
        className={`cursor-default outline-none select-none [-webkit-touch-callout:none] ${buttonClassName}`}
      >
        {children}
      </button>
      {/* Portalled to the body and drawn above everything (Hex included): inside the header it would sit under him. */}
      {mounted && createPortal(
      <AnimatePresence>
        {open && anchor && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Developer testing panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "100% 0%", top: anchor.top, right: anchor.right }}
            className="fixed z-[2147483647] w-[270px] rounded-xl border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
          >
            <p className="text-[13px] leading-[18px] text-[#818185] dark:text-[#9FA19F]">
              For testing by devs only. Temporary.
            </p>
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onBack();
                }}
                className={BUTTON}
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
            )}
            <button type="button" onClick={() => toggleTheme(WIPE)} className={BUTTON}>
              {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              {dark ? "Switch to light mode" : "Switch to dark mode"}
            </button>
            {fullscreen.available && (
              <button type="button" onClick={fullscreen.toggle} className={BUTTON}>
                {fullscreen.active ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                {fullscreen.active ? "Exit full screen" : "Full screen"}
              </button>
            )}
            <button type="button" onClick={() => setBatteryUnlimited(!unlimited)} className={BUTTON}>
              <InfinityIcon className="h-5 w-5" />
              {unlimited ? "Back to normal battery" : "Infinite battery"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  );
}
