"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion } from "framer-motion";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";

type Rect = { x: number; y: number; width: number; height: number };

/** Hex is drawn at this fraction of his anchor box, centred, then nudged
 * down by `NUDGE_DOWN` of the box's height. */
const SIZE = 0.7;
const NUDGE_DOWN = -0.04;
/** And to the right by this fraction of the box's width. */
const NUDGE_RIGHT = 0.06;

/** Hex's glide between tiles — shorter than a run's step, so he arrives before the next one. */
const WALK_TRANSITION = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** Hex resting in his idle loop. */
function IdleHex() {
  const { RiveComponent } = useHexRive(HEX_LAYOUT, HEX_STATE.idle);
  return <RiveComponent className="h-full w-full" />;
}

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
      const next = { x: a.left - c.left, y: a.top - c.top, width: a.width, height: a.height };
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
      transition={WALK_TRANSITION}
    >
      <IdleHex />
    </motion.div>
  );
}
