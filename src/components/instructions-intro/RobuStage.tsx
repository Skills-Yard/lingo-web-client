"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { RobuEyeBlink } from "./RobuEyeBlink";
import { RobuIntro } from "./RobuIntro";

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
  /** Whether the one-shot `intro` timeline has finished. Owned by the flow
   * (not this component) so CoverScreen's own "hold everything else back
   * until Robu has arrived" choreography can react to the very same signal
   * instead of guessing at a fixed timer that could fall out of sync with
   * however long the actual animation takes. */
  introDone: boolean;
  onIntroComplete: () => void;
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
 *
 * The very first time Robu appears, he plays `intro.riv`'s one-shot `intro`
 * timeline instead of the wrapper doing a CSS/framer fade — once that
 * finishes (`introDone`), this swaps over to the normal, looping
 * `<RobuEyeBlink>` for the rest of the session.
 */
export function RobuStage({
  anchorEl,
  shake,
  containerRef,
  introDone,
  onIntroComplete,
}: RobuStageProps) {
  const [rect, setRect] = useState<Rect | null>(null);

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
      animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
      transition={ROBU_WALK_TRANSITION}
    >
      <div className={`h-full w-full ${shake ? "animate-shake" : ""}`}>
        {introDone ? (
          <RobuEyeBlink className="h-full w-full" />
        ) : (
          <RobuIntro className="h-full w-full" onComplete={onIntroComplete} />
        )}
      </div>
    </motion.div>
  );
}
