"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { InstructionsIntroFlow as CurrentFlow } from "@/components/instructions-intro/InstructionsIntroFlow";
import { InstructionsIntroFlow as HimanshuFlow } from "@/components/instructions-intro-himanshu/InstructionsIntroFlow";
import { DesignSwitch, type DesignVariant } from "./DesignSwitch";

const STORAGE_KEY = "lingo_review_variant";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/**
 * Same circular-reveal-from-the-click-point technique as this app's own
 * dark/light `ThemeContext` (`runThemeChange`) — kept as its own copy here
 * rather than shared, since this is a standalone review-tool page and
 * shouldn't reach into (or risk perturbing) either branch's real app code.
 */
function runVariantChange(commit: () => void, origin: { x: number; y: number }) {
  const doc = document as ViewTransitionDocument;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!doc.startViewTransition || prefersReduced) {
    commit();
    return;
  }

  const { x, y } = origin;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
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
      /* transition was skipped/interrupted — the variant already switched */
    });
}

/**
 * Renders either branch's `InstructionsIntroFlow` at `/review`, switchable
 * via the bottom-left `DesignSwitch`. Both flows are the exact, untouched
 * components from their own branches (`instructions-intro/` = current,
 * `instructions-intro-himanshu/` = a self-contained copy of
 * `origin/feat/himanshu`'s version of that same folder) — this file is the
 * only new glue, and only one flow is ever mounted at a time, so switching
 * always starts that variant fresh from `initialIndex` rather than trying
 * to carry step/answer state across two genuinely different component
 * trees.
 */
export function ReviewClient({ initialIndex }: { initialIndex: number }) {
  // Starts "current" for the SSR pass; synced from localStorage once
  // mounted, same hydration-safe pattern as ThemeProvider.
  const [variant, setVariant] = useState<DesignVariant>("current");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "current" || saved === "himanshu") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration sync from localStorage
      setVariant(saved);
    }
  }, []);

  const handleChange = (next: DesignVariant, origin: { x: number; y: number }) => {
    localStorage.setItem(STORAGE_KEY, next);
    runVariantChange(() => setVariant(next), origin);
  };

  return (
    <>
      {variant === "current" ? (
        <CurrentFlow key="current" initialIndex={initialIndex} />
      ) : (
        <HimanshuFlow key="himanshu" initialIndex={initialIndex} />
      )}
      <DesignSwitch variant={variant} onChange={handleChange} />
    </>
  );
}
