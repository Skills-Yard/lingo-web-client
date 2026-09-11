"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { RobuEyeBlink } from "./RobuEyeBlink";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Robu's glide between any two screens' anchors — one constant so the pace
// never changes no matter which two screens it's walking between.
export const ROBU_WALK_TRANSITION = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};
// Only used once, for the very first anchor Robu ever measures (the app's
// opening fade), which wants a gentler curve than the glide — see
// CoverScreen's own note on why WALK_TRANSITION's snappy easing reads as a
// cut when reused for a fade instead of a position change.
const ENTRY_TRANSITION = { duration: 0.9, ease: "easeInOut" as const };

interface RobuStageProps {
  /** DOM node of whichever screen's `<RobuAnchor>` is currently mounted —
   * null only for the instant before the very first one registers. */
  anchorEl: HTMLDivElement | null;
  /** Nudge Robu with a little shake — used while cover-reveal is prompting a tap. */
  shake?: boolean;
  /** Positioning root every anchor's rect is measured against. Must be
   * `position: relative` (or similar) and contain every screen that renders
   * a `<RobuAnchor>`. */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * The one and only Robu mascot instance for the entire flow. Every screen
 * renders nothing but an invisible `<RobuAnchor>` marking where Robu belongs
 * in its own layout — this component measures that anchor and glides the
 * real, single Rive canvas over to it instead of each screen mounting (and
 * the previous screen unmounting) its own mascot. Because the canvas itself
 * never unmounts between screens, Robu reads as one continuous character
 * walking the learner through the flow rather than a fresh mascot cutting in
 * on every screen.
 */
export function RobuStage({ anchorEl, shake, containerRef }: RobuStageProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  // Only the very first measurement gets the gentler fade-in treatment;
  // every rect change after that is a glide between two real screens. Kept
  // as state (flipped inside the effect below, never read/written during
  // render) rather than a ref, since a ref's value must never be read while
  // rendering.
  const [isFirstPositioning, setIsFirstPositioning] = useState(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!anchorEl || !container) return;

    // Polled every frame rather than only on discrete Resize/scroll events:
    // an anchor can also move because one of *its own* ancestors is mid-way
    // through a separate layout animation (e.g. cover-reveal's own row swap),
    // which changes the anchor's rendered position every frame without
    // firing a ResizeObserver (nothing actually resized). Sampling each
    // frame catches that glide too, so Robu keeps pace with it instead of
    // only snapping once it settles. The `key` guard skips the setState
    // (and the render it would cost) on the vast majority of frames where
    // nothing has actually moved.
    let rafId: number;
    let lastKey = "";
    const measure = () => {
      const a = anchorEl.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      const next = {
        x: a.left - c.left,
        y: a.top - c.top,
        width: a.width,
        height: a.height,
      };
      const key = `${next.x}|${next.y}|${next.width}|${next.height}`;
      if (key !== lastKey) {
        // The very first measurement (lastKey still "") is the one the
        // render below treats as "first positioning"; every measurement
        // after that is a real glide between two anchors.
        if (lastKey !== "") setIsFirstPositioning(false);
        lastKey = key;
        setRect(next);
      }
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [anchorEl, containerRef]);

  if (!rect) return null;

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-20"
      initial={isFirstPositioning ? { opacity: 0, scale: 0.92 } : false}
      animate={{
        opacity: 1,
        scale: 1,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }}
      transition={isFirstPositioning ? ENTRY_TRANSITION : ROBU_WALK_TRANSITION}
    >
      {/* `shake`'s CSS `animation` lives on this inner element, not the
          motion.div above — a CSS keyframe animation targeting `transform`
          overrides framer-motion's own inline `transform` outright (it wins
          the cascade for that property), which was silently wiping out
          every x/y/scale value framer set and pinning Robu to (0, 0) the
          whole time cover-reveal was prompting a tap. Nesting them on
          separate elements lets each own its own transform layer. */}
      <div className={`h-full w-full ${shake ? "animate-shake" : ""}`}>
        <RobuEyeBlink className="h-full w-full" />
      </div>
    </motion.div>
  );
}
