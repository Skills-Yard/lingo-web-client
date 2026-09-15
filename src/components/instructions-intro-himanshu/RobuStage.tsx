"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { RobuMascot } from "./RobuMascot";

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
  /** Fired once Robu's one-shot entrance (see RobuMascot) has fully played
   * through. Forwarded straight from RobuMascot so the flow can sync
   * CoverScreen's own choreography (shrinking Robu, revealing his greeting
   * bubble) to it. */
  onIntroComplete: () => void;
  /** Forwarded straight to RobuMascot — see its own doc comment. */
  skipIntro?: boolean;
  /** Forwarded straight to RobuMascot — see its own doc comment. */
  talking?: boolean;
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
 * `<RobuMascot>` itself is the *one* Rive instance for Robu's whole time on
 * screen — it plays the one-shot entrance itself and then keeps looping
 * ambiently, so this component never swaps it out for a different
 * component/canvas. That used to happen here (intro component -> eyeblink
 * component right as Robu shrank to his normal size) and was the actual
 * source of the entrance ever reading as a size/position jump: a brand new
 * canvas mounting (its own decode delay, a completely different first
 * frame) at the exact instant the shrink kicked in. With a single instance,
 * only the shrink itself (the `motion.div` below) is ever visible.
 */
export function RobuStage({
  anchorEl,
  shake,
  containerRef,
  onIntroComplete,
  skipIntro,
  talking,
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
      <div className={`h-full w-full `}>
        <RobuMascot
          className="h-full w-full"
          onIntroComplete={onIntroComplete}
          skipIntro={skipIntro}
          talking={talking}
        />
      </div>
    </motion.div>
  );
}
