"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

/** Where the circular reveal should originate from (usually the toggle button). */
type TransitionOrigin = { x: number; y: number };

/** A diagonal sweep (see `runWipe`), in each theme's own background colour. */
type Wipe = { wipe: Record<Theme, string> };

/** Where the circular reveal should start from; a `Wipe` for a diagonal
 * sweep from the top-right corner to the bottom-left instead; or
 * `"instant"` to skip the animation altogether. */
type ThemeChange = TransitionOrigin | Wipe | "instant";

const WIPE_MS = 700;
let wiping = false;

/**
 * A band of `color` (the new theme's background) sweeps across the screen
 * from the top-right corner to the bottom-left, its edges parallel to the
 * other diagonal so it reaches both remaining corners together. The theme
 * flips at the halfway point, while the band covers the whole screen, so
 * the band's trailing edge uncovers the new theme behind it.
 *
 * Unlike the circular reveal this takes no page snapshot and animates only
 * `transform`, which the browser runs off the main thread — so it stays
 * smooth even while the page is busy (the onboarding's Rive fox).
 */
function runWipe(commit: () => void, color: string) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const diagonal = Math.hypot(w, h);
  // Distance between the top-right and bottom-left corners, measured
  // along the sweep direction.
  const span = (2 * w * h) / diagonal;
  const feather = span * 0.15;
  const thickness = span + 2 * feather;
  const travel = (span + thickness) / 2;
  // Unit vector of the sweep, and the band's tilt (its length runs along
  // the top-left to bottom-right diagonal).
  const nx = -h / diagonal;
  const ny = w / diagonal;
  const angle = (Math.atan2(h, w) * 180) / Math.PI;
  const at = (s: number) => `translate(${nx * s}px, ${ny * s}px) rotate(${angle}deg)`;
  const edge = (feather / thickness) * 100;

  const band = document.createElement("div");
  band.setAttribute("aria-hidden", "true");
  Object.assign(band.style, {
    position: "fixed",
    left: `${w / 2 - diagonal / 2 - 2}px`,
    top: `${h / 2 - thickness / 2}px`,
    width: `${diagonal + 4}px`,
    height: `${thickness}px`,
    zIndex: "2147483647",
    pointerEvents: "none",
    willChange: "transform",
    transform: at(-travel),
    background: `linear-gradient(to bottom, transparent, ${color} ${edge}%, ${color} ${100 - edge}%, transparent)`,
  });
  document.body.appendChild(band);
  wiping = true;

  const done = () => {
    band.remove();
    wiping = false;
  };
  // Two halves of one sine ease-in-out, so the speed carries straight
  // through the midpoint where the theme flips.
  band
    .animate([{ transform: at(-travel) }, { transform: at(0) }], {
      duration: WIPE_MS / 2,
      easing: "cubic-bezier(0.12, 0, 0.39, 0)",
      fill: "forwards",
    })
    .finished.then(() => {
      commit();
      return band.animate([{ transform: at(0) }, { transform: at(travel) }], {
        duration: WIPE_MS / 2,
        easing: "cubic-bezier(0.61, 1, 0.88, 1)",
        fill: "forwards",
      }).finished;
    })
    .then(done, done);
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
 * The same top-right → bottom-left diagonal sweep as `runWipe`, but as a
 * View Transition: the new theme's snapshot is revealed over the old one,
 * so the text, fox and buttons stay on screen the whole time instead of
 * vanishing under an opaque band at the halfway point.
 */
function runDiagonalReveal(doc: ViewTransitionDocument, commit: () => void) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const diagonal = Math.hypot(w, h);
  // Sweep direction (toward the bottom-left) and the edge's direction
  // (parallel to the top-left → bottom-right diagonal).
  const nx = -h / diagonal;
  const ny = w / diagonal;
  const dx = w / diagonal;
  const dy = h / diagonal;
  const span = (2 * w * h) / diagonal;
  const far = diagonal * 2;
  // The revealed half-plane: everything behind an edge `s` px from the
  // top-right corner. Same four vertices at every `s`, so it interpolates
  // as a straight sweep.
  const reveal = (s: number) => {
    const cx = w + nx * s;
    const cy = ny * s;
    const pts = [
      [cx + dx * far, cy + dy * far],
      [cx - dx * far, cy - dy * far],
      [cx - dx * far - nx * far, cy - dy * far - ny * far],
      [cx + dx * far - nx * far, cy + dy * far - ny * far],
    ];
    return `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;
  };

  wiping = true;
  const transition = doc.startViewTransition(() => {
    flushSync(commit);
  });
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [reveal(0), reveal(span)] },
        {
          duration: WIPE_MS,
          easing: "cubic-bezier(0.37, 0, 0.63, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* transition was skipped/interrupted — theme is already applied */
    });
  const done = () => {
    wiping = false;
  };
  transition.finished.then(done, done);
}

/**
 * Swap the theme with a circular-reveal animation via the View Transitions API,
 * expanding from `origin` — or with a diagonal wipe (see `runWipe`). Falls back to an instant swap when the API is missing
 * or the user prefers reduced motion.
 */
function runThemeChange(commit: () => void, nextTheme: Theme, origin?: ThemeChange) {
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (origin === "instant" || prefersReduced) {
    commit();
    return;
  }
  if (origin && "wipe" in origin) {
    if (!doc.startViewTransition) runWipe(commit, origin.wipe[nextTheme]);
    else runDiagonalReveal(doc, commit);
    return;
  }
  if (!doc.startViewTransition) {
    commit();
    return;
  }

  const x = origin?.x ?? window.innerWidth;
  const y = origin?.y ?? 0;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    // flushSync so React commits the new theme before the "new" snapshot is taken.
    flushSync(commit);
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
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
    // A second tap mid-wipe would stack a second band over the first.
    if (wiping) return;
    localStorage.setItem("lingo_theme", newTheme);
    runThemeChange(
      () => {
        setThemeState(newTheme);
        applyTheme(newTheme);
      },
      newTheme,
      origin,
    );
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
