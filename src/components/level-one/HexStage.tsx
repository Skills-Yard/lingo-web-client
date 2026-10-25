"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { OnboardingHex } from "./FeedbackPanel";

type Rect = { x: number; y: number; width: number; height: number };

/** Hex is drawn at this fraction of his anchor box, centred, then nudged
 * down by `NUDGE_DOWN` of the box's height. */
export const SIZE = 0.7;
export const NUDGE_DOWN = 0.07;
/** And to the right by this fraction of the box's width. */
export const NUDGE_RIGHT = 0.06;

/** Hex's glide between tiles — shorter than a run's step, so he arrives before the next one. */
// Springs, not tweens: the target is re-measured every frame (the board floats
// and slides), and a tween restarts from its slow start each time the target
// moves, so one axis would lag the other and he'd travel in an L. A spring
// keeps its velocity through a moving target, so x and y arrive together.
const WALK_TRANSITION = { type: "spring", stiffness: 320, damping: 30, restDelta: 0.1, restSpeed: 0.1 } as const;

/** Hex's slow, soft trip from one spot to another (header -> platform). */
const PLACE_TRANSITION = { type: "spring", stiffness: 42, damping: 12.5, restDelta: 0.1, restSpeed: 0.1 } as const;
/** How long a placing trip is given before he is back to walking. */
const PLACE_MS = 1500;

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
    const timer = window.setTimeout(() => setPlacing(false), PLACE_MS);
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
      className="pointer-events-none absolute top-0 left-0 z-[100]"
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

/** After his exit animation has played, whatever is left of him fades out. */
export const LEAVE_FADE_DELAY_S = 0.8;

/** Hex's trip from one slot to another (question -> result panel). */
// A spring, not a tween: the target moves while he travels (the panel is still
// sliding up), and a spring keeps its velocity through that where a timed
// tween would restart every frame.
const GLIDE_TRANSITION = { type: "spring", stiffness: 70, damping: 18, mass: 1, restDelta: 0.5, restSpeed: 2 } as const;

/** The quicker, better-damped glide to a hinted card, timed to land as its flip stops. */
const HINT_GLIDE_TRANSITION = { type: "spring", stiffness: 170, damping: 24, mass: 0.9, restDelta: 0.5, restSpeed: 2 } as const;

/**
 * One Hex that stays on screen and glides from slot to slot: it fills
 * whichever of `fromEl` / `toEl` is current, re-measured every frame so it
 * keeps pace with a slot that is itself sliding (the result panel). The
 * `containerRef` box lives inside the shell's scaled stage, so measurements
 * are divided by that scale.
 */
export function HexGlide({
  fromEl,
  toEl = null,
  moved = false,
  arrivedCue = null,
  enter,
  entryStyle,
  leaving = false,
  rising = false,
  fromScale = 1,
  containerRef,
}: {
  /** Grows Hex's box around its centre while he is in `fromEl` (the artboard has padding, so he reads small). */
  fromScale?: number;
  fromEl: HTMLDivElement | null;
  toEl?: HTMLDivElement | null;
  /** True once Hex should be in `toEl`. */
  moved?: boolean;
  /** A trigger Hex plays once he has reached `toEl`. */
  arrivedCue?: string | null;
  /** The trigger that plays his entrance. */
  enter?: string;
  /** The `entryStyle` he enters with. */
  entryStyle?: number;
  /** Hex leaves the screen (and stays gone). */
  leaving?: boolean;
  /** Hex stays where he is while `fromEl` closes: whatever slides up over
   * that spot (the options) covers him, as it is drawn above him. */
  rising?: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [arrived, setArrived] = useState(false);
  // His size and left edge while his slot had room, kept for the ride up.
  const frozen = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const target = moved && toEl ? toEl : fromEl;
  const scale = target === fromEl ? fromScale : 1;
  // Once he has left and faded he is taken off the screen, so the canvas is
  // not left resizing as his slot closes.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setGone(true), (LEAVE_FADE_DELAY_S + 0.3) * 1000);
    return () => window.clearTimeout(timer);
  }, [leaving]);

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

  if (rect && !rising && rect.width >= 1 && rect.height >= 1) {
    frozen.current = { x: rect.x - (rect.width * (scale - 1)) / 2, y: rect.y - (rect.height * (scale - 1)) / 2, width: rect.width * scale, height: rect.height * scale };
  }
  const ride = rising ? frozen.current : null;

  // A slot with no size (closed) has no room to draw him in — unless he is
  // riding it up.
  if (!rect || gone || (!ride && (rect.width < 1 || rect.height < 1))) return null;

  return (
    <motion.div
      aria-hidden
      // Once `rising`, he sits below the header and the options (z-10).
      className={`pointer-events-none absolute top-0 left-0 ${ride ? "z-[5]" : "z-[100]"}`}
      initial={false}
      animate={
        ride
          ? { x: ride.x, y: ride.y, width: ride.width, height: ride.height, opacity: 1 }
          : { x: rect.x - (rect.width * (scale - 1)) / 2, y: rect.y - (rect.height * (scale - 1)) / 2, width: rect.width * scale, height: rect.height * scale, opacity: leaving ? 0 : 1 }
      }
      transition={{ default: moved ? HINT_GLIDE_TRANSITION : GLIDE_TRANSITION, opacity: leaving ? { delay: LEAVE_FADE_DELAY_S, duration: 0.15 } : { duration: 0 } }}
      onAnimationComplete={() => setArrived(moved)}
    >
      <OnboardingHex entryKey="quiz" enter={enter} entryStyle={entryStyle} leaving={leaving} cue={arrived ? arrivedCue : null} />
    </motion.div>
  );
}
