"use client";

import { Check, MapPin, Moon, Sun, Undo2 } from "lucide-react";
import { PanelButton } from "@/components/onboarding/BatteryMenu";
import type { PanelTint } from "@/components/onboarding/BatteryMenu";
import { useTheme } from "@/context/ThemeContext";
import { PLAYABLE_MODULES } from "@/lib/levelProgress";
import { PLATFORM_CONFIGS } from "./levelConfig";

/** The level path's own background in each theme, for the theme switch's wipe. */
const THEME_WIPE = { wipe: { light: "#ffffff", dark: "#0B132B" } } as const;

const MODULE_NUMBERS = Array.from({ length: PLAYABLE_MODULES }, (_, i) => i + 1);

/** The modules take the answer cards' three fills in turn, as Level 1's options do. */
const MODULE_TINTS: PanelTint[] = ["lavender", "rose", "cream"];

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
      <PanelButton onClick={() => toggleTheme(THEME_WIPE)}>
        {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        {dark ? "Light mode" : "Dark mode"}
      </PanelButton>

      <Divider />

      <PanelButton onClick={onComplete} disabled={done >= PLATFORM_CONFIGS.length}>
        <Check className="h-5 w-5" />
        Complete module
      </PanelButton>
      <PanelButton onClick={onUndo} disabled={done <= 0}>
        <Undo2 className="h-5 w-5" />
        Undo module
      </PanelButton>

      <Divider />

      {MODULE_NUMBERS.map((module) => {
        const current = module === playing;
        return (
          <PanelButton
            key={module}
            tint={MODULE_TINTS[(module - 1) % MODULE_TINTS.length]}
            selected={current}
            aria-pressed={current}
            onClick={() => {
              onPickModule(module);
              onClose();
            }}
          >
            <MapPin className={`h-5 w-5 ${current ? "text-[#008566] dark:text-[#34D399]" : ""}`} />
            <span className="flex-1 text-left">Module {module}</span>
            {current && <Check className="h-4 w-4 text-[#008566] dark:text-[#34D399]" />}
          </PanelButton>
        );
      })}
    </>
  );
}
