"use client";

import { GitBranch, Sparkles } from "lucide-react";

export type DesignVariant = "current" | "himanshu";

interface DesignSwitchProps {
  variant: DesignVariant;
  /** Fired with the new variant and the click's viewport coordinates, so the
   * caller can drive the same circular view-transition wipe the app's own
   * dark/light `ThemeToggle` uses (see `src/context/ThemeContext.tsx`). */
  onChange: (variant: DesignVariant, origin: { x: number; y: number }) => void;
}

/**
 * Bottom-left, fixed, two-option pill — deliberately styled after this app's
 * own `ThemeToggle` (same track/thumb shape, same "flip with a wipe" feel)
 * so switching design variants reads as the same kind of gesture switching
 * light/dark does, just choosing between "current" and "himanshu" instead of
 * a color scheme. Purely a review-tool affordance: it lives only on
 * `/review` and never touches either branch's own components.
 */
export function DesignSwitch({ variant, onChange }: DesignSwitchProps) {
  const isHimanshu = variant === "himanshu";

  const handleClick = (next: DesignVariant, e: React.MouseEvent) => {
    if (next === variant) return;
    onChange(next, { x: e.clientX, y: e.clientY });
  };

  return (
    <div
      // `bottom-20` on mobile clears the flow's own full-width footer CTA
      // bar (only `sm:`+ up does that CTA stop spanning edge-to-edge), so
      // the switch never sits on top of the real "Next"/"Got it!" button.
      className="fixed bottom-20 left-4 z-50 inline-flex items-center rounded-2xl border border-border bg-card p-1 shadow-lg backdrop-blur-sm sm:bottom-4"
      role="radiogroup"
      aria-label="Design variant"
    >
      {/* Sliding highlight — translates between the two options instead of
          each button re-styling independently, same "thumb" language as a
          real light/dark switch. */}
      <div
        aria-hidden
        className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-primary shadow-sm transition-transform duration-300 ease-in-out ${
          isHimanshu ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
        }`}
      />

      <button
        type="button"
        role="radio"
        aria-checked={!isHimanshu}
        onClick={(e) => handleClick("current", e)}
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer ${
          !isHimanshu ? "text-primary-foreground" : "text-foreground hover:text-primary"
        }`}
        title="Current branch design"
      >
        <GitBranch className="h-3.5 w-3.5" />
        Current
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isHimanshu}
        onClick={(e) => handleClick("himanshu", e)}
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer ${
          isHimanshu ? "text-primary-foreground" : "text-foreground hover:text-primary"
        }`}
        title="feat/himanshu design"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Himanshu
      </button>
    </div>
  );
}
