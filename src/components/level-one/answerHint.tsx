"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { TapHint, type TapTarget } from "@/components/variable/TapHint";

/**
 * The one hint every question of every module gives, the way Variable's screen 27 gives it: the hint button makes the
 * pointing hand (`TapHint`) tap the right answer, and that answer takes a pale orange tint and one shine (`PointedLook`)
 * for as long as the hand is on it. Nothing floats, flips or moves, and nothing is picked for the learner.
 *
 * A screen keeps `useAnswerHint()`, calls `press(correctId)` from its hint button, `stop()` as soon as the learner does
 * something (picks, checks, tries again), draws `hand` among its content (inside the stage, so it can lie over the
 * answers), and gives each answer `data-hint={id}` and `pointed={pointedId === id}`.
 */

/** How far (px) inside the answer's left edge the fingertip lands, at its middle height: the hand stands left of the words. */
export const HINT_FROM_LEFT = 26;
/** The hand waits this long (ms) before it comes in: the press should be answered at once. */
const HINT_PRESS_DELAY_MS = 200;
/**
 * The answer the hand points at takes the tint and one shine for as long as the hand is on it, and no longer: it starts
 * this long (ms) after the press, as the hand (200ms wait, 0.42s to move in) gets there, and ends this long after that,
 * as the hand (press 0.08s, release 0.14s, hold 0.28s, then 0.3s before it leaves: about 0.8s) starts to leave.
 */
const HINT_GLOW_AFTER_MS = 620;
const HINT_GLOW_FOR_MS = 800;

type Demo = { press: number; targets: readonly TapTarget[] };

export function useAnswerHint() {
  // The hand's demonstration (and which press it is, so a second press plays it again), and the answer that glows.
  const [demo, setDemo] = useState<Demo | null>(null);
  const [pointedId, setPointedId] = useState<string | null>(null);
  const presses = useRef(0);
  const timers = useRef<{ glow?: number; end?: number }>({});

  const clearTimers = () => {
    window.clearTimeout(timers.current.glow);
    window.clearTimeout(timers.current.end);
  };
  useEffect(() => clearTimers, []);

  /** The learner acts (or the screen moves on): the hand goes and the answer stops glowing. */
  const stop = useCallback(() => {
    clearTimers();
    setDemo(null);
    setPointedId(null);
  }, []);

  /** The hint button: the hand shows the answer marked `data-hint={id}`. Pressing again plays it again. */
  const press = useCallback((id: string, fromLeft = HINT_FROM_LEFT) => {
    clearTimers();
    setPointedId(null);
    presses.current += 1;
    setDemo({ press: presses.current, targets: [{ id, fromLeft }] });
    timers.current.glow = window.setTimeout(() => setPointedId(id), HINT_GLOW_AFTER_MS);
    timers.current.end = window.setTimeout(() => setPointedId(null), HINT_GLOW_AFTER_MS + HINT_GLOW_FOR_MS);
  }, []);

  const hand: ReactNode = demo ? <TapHint targets={demo.targets} runKey={demo.press} startAfterMs={HINT_PRESS_DELAY_MS} active /> : null;
  return { pointedId, hand, press, stop };
}

/** The shine on an answer the hand points at: one quick crossing, as long as the hand's stay on it. */
const POINT_SHINE_S = 0.5;
const SHINE_BAND = "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)";

/**
 * What an answer wears while the hint's hand is on it: a pale orange tint behind its words and a shine crossing it once.
 * Put it inside the answer's button, which must be `relative isolate` (the tint sits behind the content, above the
 * button's own fill). It takes the button's corners (`rounded-[inherit]`) and clips its own shine.
 */
export function PointedLook({ pointed }: { pointed: boolean }) {
  return (
    <>
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: pointed ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[#FFE7D1] dark:bg-[#33220F]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {pointed && (
          <motion.span
            initial={{ left: "-25%", opacity: 0 }}
            animate={{ left: ["-25%", "105%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: POINT_SHINE_S, ease: "easeInOut", opacity: { duration: POINT_SHINE_S, times: [0, 0.2, 0.8, 1] } }}
            style={{ skewX: -20, backgroundImage: SHINE_BAND }}
            className="absolute inset-y-0 w-14"
          />
        )}
      </span>
    </>
  );
}
