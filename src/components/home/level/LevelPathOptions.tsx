"use client";

import { Check, MapPin, Moon, Sun, Undo2 } from "lucide-react";
import { PANEL_BUTTON } from "@/components/onboarding/BatteryMenu";
import { useTheme } from "@/context/ThemeContext";
import { PLAYABLE_MODULES } from "@/lib/levelProgress";
import { PLATFORM_CONFIGS } from "./levelConfig";

/** The level path's own background in each theme, for the theme switch's wipe. */
const THEME_WIPE = { wipe: { light: "#ffffff", dark: "#0B132B" } } as const;

const MODULE_NUMBERS = Array.from({ length: PLAYABLE_MODULES }, (_, i) => i + 1);

const Divider = () => <div className="mt-3 border-t border-black/8 dark:border-white/12" />;

type LevelPathOptionsProps = {
  /** How many modules the learner has finished. */
  done: number;
  onComplete: () => void;
  onUndo: () => void;
  /** Puts the learner on module `module` (1-based). */
  onPickModule: (module: number) => void;
  /** Closes the panel these options are in. */
  onClose: () => void;
};

/**
 * What the level path adds to the battery's hidden dev panel: the light / dark
 * switch and the module controls (finish, undo, jump to any module).
 */
export function LevelPathOptions({ done, onComplete, onUndo, onPickModule, onClose }: LevelPathOptionsProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const playing = done + 1;

  return (
    <>
      <button type="button" className={PANEL_BUTTON} onClick={() => toggleTheme(THEME_WIPE)}>
        {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        {dark ? "Light mode" : "Dark mode"}
      </button>

      <Divider />

      <button type="button" className={PANEL_BUTTON} onClick={onComplete} disabled={done >= PLATFORM_CONFIGS.length}>
        <Check className="h-5 w-5" />
        Complete module
      </button>
      <button type="button" className={PANEL_BUTTON} onClick={onUndo} disabled={done <= 0}>
        <Undo2 className="h-5 w-5" />
        Undo module
      </button>

      <Divider />

      {MODULE_NUMBERS.map((module) => (
        <button
          key={module}
          type="button"
          className={PANEL_BUTTON}
          aria-pressed={module === playing}
          onClick={() => {
            onPickModule(module);
            onClose();
          }}
        >
          <MapPin className={`h-5 w-5 ${module === playing ? "text-[#6F5CFF]" : ""}`} />
          <span className="flex-1 text-left">Module {module}</span>
          {module === playing && <Check className="h-4 w-4 text-[#6F5CFF]" />}
        </button>
      ))}
    </>
  );
}
