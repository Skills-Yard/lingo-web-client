"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { OnboardingHex } from "./FeedbackPanel";

type Rect = { x: number; y: number; width: number; height: number };

/** Hex is drawn at this fraction of his anchor box, centred, then nudged
 * down by `NUDGE_DOWN` of the box's height. */
const SIZE = 0.7;
const NUDGE_DOWN = -0.04;
/** And to the right by this fraction of the box's width. */
const NUDGE_RIGHT = 0.06;

/** Hex's glide between tiles — shorter than a run's step, so he arrives before the next one. */
const WALK_TRANSITION = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

/** Hex's slow, soft trip from one spot to another (header -> platform). */
const PLACE_TRANSITION = { duration: 1.4, ease: [0.45, 0, 0.2, 1] as const };

/**
 * The one Hex for a screen that has a game board: it measures whichever
 * `<RobuAnchor>` is mounted (the header's, then the player tile) and glides
 * one Rive canvas to it — the same mechanism as RobuStage, with Hex as the
 * character.
 */
export function HexStage({
  anchorEl,
  containerRef,
}: {
  anchorEl: HTMLDivElement | null;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  // A new anchor (not just the same one moving a tile) means he is being
  // placed somewhere new, which plays slowly.
  const [placing, setPlacing] = useState(false);
  const hadAnchor = useRef(false);

  useEffect(() => {
    if (!anchorEl) return;
    if (!hadAnchor.current) {
      hadAnchor.current = true;
      return;
    }
    setPlacing(true);
    const timer = window.setTimeout(() => setPlacing(false), PLACE_TRANSITION.duration * 1000 + 100);
    return () => window.clearTimeout(timer);
  }, [anchorEl]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!anchorEl || !container) return;

    // Sampled every frame so he keeps pace with anchors that move through
    // their own layout animations; setState only when something changed.
    let rafId: number;
    let lastKey = "";
    const measure = () => {
      const a = anchorEl.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      // The shell scales its whole stage, so screen px are divided back
      // into the container's own (unscaled) px.
      const k = container.offsetWidth > 0 ? c.width / container.offsetWidth : 1;
      const next = { x: (a.left - c.left) / k, y: (a.top - c.top) / k, width: a.width / k, height: a.height / k };
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
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-20"
      animate={{
        x: rect.x + (rect.width * (1 - SIZE)) / 2 + rect.width * NUDGE_RIGHT,
        y: rect.y + (rect.height * (1 - SIZE)) / 2 + rect.height * NUDGE_DOWN,
        width: rect.width * SIZE,
        height: rect.height * SIZE,
      }}
      transition={placing ? PLACE_TRANSITION : WALK_TRANSITION}
    >
      <OnboardingHex entryKey="game" />
    </motion.div>
  );
}

/** Hex's trip from one slot to another (question -> result panel). */
// A spring, not a tween: the target moves while he travels (the panel is still
// sliding up), and a spring keeps its velocity through that where a timed
// tween would restart every frame.
const GLIDE_TRANSITION = { type: "spring", stiffness: 70, damping: 18, mass: 1, restDelta: 0.5, restSpeed: 2 } as const;

/**
 * One Hex that stays on screen and glides from slot to slot: it fills
 * whichever of `fromEl` / `toEl` is current, re-measured every frame so it
 * keeps pace with a slot that is itself sliding (the result panel). The
 * `containerRef` box lives inside the shell's scaled stage, so measurements
 * are divided by that scale.
 */
export function HexGlide({
  fromEl,
  toEl,
  moved,
  arrivedCue = null,
  enter,
  entryStyle,
  containerRef,
}: {
  fromEl: HTMLDivElement | null;
  toEl: HTMLDivElement | null;
  /** True once Hex should be in `toEl`. */
  moved: boolean;
  /** A trigger Hex plays once he has reached `toEl`. */
  arrivedCue?: string | null;
  /** The trigger that plays his entrance. */
  enter?: string;
  /** The `entryStyle` he enters with. */
  entryStyle?: number;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [arrived, setArrived] = useState(false);
  const target = moved && toEl ? toEl : fromEl;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!target || !container) return;
    let rafId: number;
    let lastKey = "";
    const measure = () => {
      const a = target.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      const k = container.offsetWidth ? c.width / container.offsetWidth : 1;
      const next = { x: (a.left - c.left) / k, y: (a.top - c.top) / k, width: a.width / k, height: a.height / k };
      const key = `${next.x}|${next.y}|${next.width}|${next.height}`;
      if (key !== lastKey) {
        lastKey = key;
        setRect(next);
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [target, containerRef]);

  if (!rect) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-30"
      initial={false}
      animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
      transition={GLIDE_TRANSITION}
      onAnimationComplete={() => setArrived(moved)}
    >
      <OnboardingHex entryKey="quiz" enter={enter} entryStyle={entryStyle} cue={arrived ? arrivedCue : null} />
    </motion.div>
  );
}
