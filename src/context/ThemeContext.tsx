"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

/** Where the circular reveal should originate from (usually the toggle button). */
type TransitionOrigin = { x: number; y: number };

/** Where the circular reveal should start from; `"wipe"` for a diagonal
 * sweep from the top-right corner to the bottom-left instead; or
 * `"instant"` to skip the animation altogether. */
type ThemeChange = TransitionOrigin | "wipe" | "instant";

/** Clip-path keyframes for the reveal: a circle growing from `origin`, or
 * for "wipe" a triangle anchored at the top-right corner whose long edge
 * sweeps across, parallel to the other diagonal — at full size that edge
 * runs through the bottom-left corner, so the whole screen is covered. */
function revealKeyframes(origin: TransitionOrigin | "wipe" | undefined): string[] {
  if (origin === "wipe") {
    return ["polygon(100% 0%, 100% 0%, 100% 0%)", "polygon(100% 0%, 100% 200%, -100% 0%)"];
  }
  const x = origin?.x ?? window.innerWidth;
  const y = origin?.y ?? 0;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  return [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, origin?: ThemeChange) => void;
  toggleTheme: (origin?: ThemeChange) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/** Reflect the theme onto <html> so the CSS (`.dark` / `[data-theme]`) picks it up. */
function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

function resolveInitialTheme(): Theme {
  const saved = localStorage.getItem("lingo_theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Swap the theme with a reveal animation via the View Transitions API — a
 * circle expanding from `origin`, or a diagonal wipe. Falls back to an instant swap when the API is missing
 * or the user prefers reduced motion.
 */
function runThemeChange(commit: () => void, origin?: ThemeChange) {
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (origin === "instant" || !doc.startViewTransition || prefersReduced) {
    commit();
    return;
  }

  const clipPath = revealKeyframes(origin);
  const transition = doc.startViewTransition(() => {
    // flushSync so React commits the new theme before the "new" snapshot is taken.
    flushSync(commit);
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath },
        {
          duration: 450,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* transition was skipped/interrupted — theme is already applied */
    });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Starts "light" for the SSR pass; the effect below syncs it from localStorage /
  // the OS preference once we're on the client.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initial = resolveInitialTheme();
    applyTheme(initial);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration sync from localStorage / matchMedia
    setThemeState(initial);
  }, []);

  const setTheme = (newTheme: Theme, origin?: ThemeChange) => {
    localStorage.setItem("lingo_theme", newTheme);
    runThemeChange(() => {
      setThemeState(newTheme);
      applyTheme(newTheme);
    }, origin);
  };

  const toggleTheme = (origin?: ThemeChange) => {
    setTheme(theme === "dark" ? "light" : "dark", origin);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
