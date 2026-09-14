"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { InstructionsIntroFlow as CurrentFlow } from "@/components/instructions-intro/InstructionsIntroFlow";
import { InstructionsIntroFlow as HimanshuFlow } from "@/components/instructions-intro-himanshu/InstructionsIntroFlow";
import { DesignSwitch, type DesignVariant } from "./DesignSwitch";

const STORAGE_KEY = "lingo_review_variant";

// The step badge every screen's shared `IntroHeader` renders — identical
// markup in both branches (IntroHeader.tsx isn't one of the 9 files that
// differ between them) — is the only outside signal this file reads.
// Sniffing it via a MutationObserver is what lets a switch land on the
// screen you're actually on, without adding any prop/callback to either
// branch's own `InstructionsIntroFlow` (which, per its own design, never
// reports its internal step back up to a caller).
const STEP_BADGE_SELECTOR = "header span.text-primary.font-semibold";

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
 * `instructions-intro-himanshu/` = a self-contained, verified byte-for-byte
 * copy of `origin/feat/himanshu`'s version of that same folder) — this file
 * is the only new glue.
 *
 * Only one flow is ever mounted at a time, so a switch is still a real
 * unmount + mount of a completely different component tree — but it no
 * longer *resets* to the start: `stepIndex` tracks whichever screen you're
 * actually on (read from the shared header's own step badge, see
 * `STEP_BADGE_SELECTOR`) and is what the next mount's `initialIndex` comes
 * from, so switching lands you on the same numbered screen instead of
 * jumping back to step 1. In-screen state (a quiz selection, the
 * cover-reveal card, a modal) is still local to whichever flow is mounted
 * and does reset on switch — carrying *that* across would mean two
 * completely different component trees somehow sharing state shaped by
 * each branch's own internals, which isn't possible without editing one of
 * them.
 */
export function ReviewClient({ initialIndex }: { initialIndex: number }) {
  // Starts "current" for the SSR pass; synced from localStorage once
  // mounted, same hydration-safe pattern as ThemeProvider.
  const [variant, setVariant] = useState<DesignVariant>("current");
  const [stepIndex, setStepIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "current" || saved === "himanshu") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration sync from localStorage
      setVariant(saved);
    }
  }, []);

  // Keeps `stepIndex` live while a flow is mounted, so whichever variant
  // mounts *next* (on a switch) starts from wherever you actually navigated
  // to, not wherever the page first loaded. Re-attached whenever `variant`
  // changes since that's a full unmount/remount of the container's content
  // (a fresh header element to observe).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const readStep = () => {
      const badge = container.querySelector(STEP_BADGE_SELECTOR);
      const n = badge ? parseInt(badge.textContent ?? "", 10) : NaN;
      if (!Number.isNaN(n) && n >= 1) {
        setStepIndex(n - 1);
      }
    };

    readStep();
    const observer = new MutationObserver(readStep);
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [variant]);

  const handleChange = (next: DesignVariant, origin: { x: number; y: number }) => {
    localStorage.setItem(STORAGE_KEY, next);
    runVariantChange(() => setVariant(next), origin);
  };

  return (
    <div ref={containerRef}>
      {variant === "current" ? (
        <CurrentFlow key="current" initialIndex={stepIndex} />
      ) : (
        <HimanshuFlow key="himanshu" initialIndex={stepIndex} />
      )}
      <DesignSwitch variant={variant} onChange={handleChange} />
    </div>
  );
}
