"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin, Maximize, Menu, Minimize, Moon, Sun, Undo2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { PLAYABLE_MODULES } from "@/lib/levelProgress";
import { EASE } from "./pathGeometry";
import { MODULES } from "./ModuleCards";

export const THEME_WIPE = { wipe: { light: "#ffffff", dark: "#0f1f26" } } as const;

export const MENU_ROW =
  "flex h-11 w-full items-center gap-3 px-3 text-left text-[13px] font-medium text-[#444444] transition-colors active:bg-black/5 disabled:opacity-35 dark:text-[#C8C7C5] dark:active:bg-white/10";

export function LevelMenu({
  done,
  onComplete,
  onUndo,
  playing,
  onPickModule,
}: {
  done: number;
  onComplete: () => void;
  onUndo: () => void;
  playing: number;
  onPickModule: (module: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const fullscreen = useFullscreen();
  const dark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-level-menu]")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div data-level-menu className="pointer-events-auto relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/8 bg-white text-[#444444] transition-transform active:scale-95 dark:border-white/12 dark:bg-[#1A1C22] dark:text-[#C8C7C5]"
      >
        <Menu className="h-5 w-5" strokeWidth={1.8} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-black/8 bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.18)] dark:border-white/12 dark:bg-[#1A1C22]"
          >
            <button type="button" className={MENU_ROW} onClick={() => toggleTheme(THEME_WIPE)}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
            {fullscreen.available && (
              <button type="button" className={MENU_ROW} onClick={fullscreen.toggle}>
                {fullscreen.active ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                {fullscreen.active ? "Exit full screen" : "Full screen"}
              </button>
            )}
            <button type="button" className={MENU_ROW} onClick={onComplete} disabled={done >= MODULES.length}>
              <Check className="h-5 w-5" />
              Complete module
            </button>
            <button type="button" className={MENU_ROW} onClick={onUndo} disabled={done <= 0}>
              <Undo2 className="h-5 w-5" />
              Undo module
            </button>
            <div className="mx-3 my-1 border-t border-black/8 dark:border-white/12" />
            {Array.from({ length: PLAYABLE_MODULES }, (_, i) => i + 1).map((module) => (
              <button
                key={module}
                type="button"
                className={MENU_ROW}
                aria-pressed={module === playing}
                onClick={() => {
                  onPickModule(module);
                  setOpen(false);
                }}
              >
                <MapPin className={`h-5 w-5 ${module === playing ? "text-[#6F5CFF]" : ""}`} />
                <span className="flex-1">Module {module}</span>
                {module === playing && <Check className="h-4 w-4 text-[#6F5CFF]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

