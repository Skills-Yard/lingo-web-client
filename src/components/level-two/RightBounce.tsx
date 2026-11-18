"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

/**
 * The bounce of a right answer. It shrinks a little first, about its middle (the top comes down and the bottom comes up
 * together, and it widens a touch), then springs out of it stretched tall as it leaves the ground, goes up high, comes
 * down and squashes flat on landing, hops up again (about two fifths as high), squashes a little, and hops once more,
 * small, before it settles. The shrink comes first and the bounce keeps its own time (`BOUNCE_S`). While it is in the
 * air a plain shadow stands on the ground where it rests.
 */
const SQUEEZE_Y = 0.8;
const SQUEEZE_X = 1.06;
const SQUEEZE_S = 0.12;
const BOUNCE_S = 0.95;
/** Its height (px) at each beat: off the ground, the top of the jump, down, the second hop, down, the third, down. */
const BOUNCE_UP = [0, -36, 0, -14, 0, -5, 0];
const BOUNCE_TIMES = [0, 0.26, 0.5, 0.67, 0.81, 0.91, 1];
const BOUNCE_EASE = ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] as const;
/** Its shape on the way: stretched tall as it rises and falls, squashed flat when it lands (height first, width the opposite way). The first value is the shrunk size it starts from. */
const SHAPE_TIMES = [0, 0.1, 0.26, 0.4, 0.5, 0.58, 0.67, 0.81, 1];
const SHAPE_Y = [SQUEEZE_Y, 1.1, 1, 1.05, 0.86, 1, 1, 0.95, 1];
const SHAPE_X = [SQUEEZE_X, 0.94, 1, 0.98, 1.09, 1, 1, 1.03, 1];
/** The shadow on the ground, and how long (ms) it stays after the card has landed. */
const SHADOW = "rgba(0,0,0,0.09)";
const SHADOW_STAYS_MS = 150;
/**
 * And once, with the bounce, a strong shine: a wide slanted band of white light that crosses the card from left to right
 * (then a second, narrower one just behind it), and two mini stars inside the card, one in its top left and one in its
 * bottom right, that twinkle one after the other. The stars have no colour of their own (the card's text colour) and a
 * very low opacity. They are gone (not looped) by `SHINE_ENDS_S` after the jump starts.
 */
const SHINE_AFTER_S = 0.04;
const SHINE_PASSES = [
  { width: "40%", duration: 0.6, after: 0 },
  { width: "22%", duration: 0.55, after: 0.2 },
] as const;
const SHINE_BAND = "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 28%, #FFFFFF 50%, rgba(255,255,255,0.45) 72%, transparent 100%)";
const STAR_S = 0.9;
const STAR_PEAK = 0.25;
const SHINE_ENDS_S = 1.9;
/** The stars: which corner, how big (px), how far in from the corner's two edges (px) and how long after the shine starts it twinkles. */
const STARS = [
  { corner: "tl", size: 14, inset: 7, after: 0.15 },
  { corner: "br", size: 12, inset: 7, after: 0.45 },
] as const;
/** A four-point star. */
const STAR_PATH = "M12 0C12.9 7.2 16.8 11.1 24 12C16.8 12.9 12.9 16.8 12 24C11.1 16.8 7.2 12.9 0 12C7.2 11.1 11.1 7.2 12 0Z";

/**
 * Wraps an answer; it bounces once, `delay` seconds after `play` turns on, with its shine and stars, and is as it was when
 * `play` turns off again (trying again). `radius` is the answer's corner (px), for the shine and the shadow. `className`
 * sizes the wrapper in its row or grid (it goes on the box that stands still and on the one that bounces). `onDrop`
 * is called the moment the card first comes down from its big jump (its hops after that are still to come), for what
 * is to change then.
 */
export function RightBounce({ play, delay = 0, radius = 16, className = "", onDrop, children }: { play: boolean; delay?: number; radius?: number; className?: string; onDrop?: () => void; children: ReactNode }) {
  // The latest callback, so a new one each render does not restart the bounce.
  const dropRef = useRef(onDrop);
  useEffect(() => {
    dropRef.current = onDrop;
  });
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  // In the air: the shadow shows on the ground.
  const [bouncing, setBouncing] = useState(false);
  // Its one-time shine and stars are playing.
  const [shining, setShining] = useState(false);

  useEffect(() => {
    if (!play) return;
    const running: { stop: () => void }[] = [];
    // Started from timers, not with the animations' own delay, so the shrink and the jump follow each other exactly.
    const squeeze = window.setTimeout(() => {
      running.push(animate(scaleY, SQUEEZE_Y, { duration: SQUEEZE_S, ease: "easeOut" }), animate(scaleX, SQUEEZE_X, { duration: SQUEEZE_S, ease: "easeOut" }));
    }, delay * 1000);
    const jump = window.setTimeout(
      () => {
        setBouncing(true);
        setShining(true);
        running.push(
          animate(scaleY, SHAPE_Y, { duration: BOUNCE_S, times: SHAPE_TIMES, ease: "easeOut" }),
          animate(scaleX, SHAPE_X, { duration: BOUNCE_S, times: SHAPE_TIMES, ease: "easeOut" }),
          animate(y, BOUNCE_UP, { duration: BOUNCE_S, times: BOUNCE_TIMES, ease: [...BOUNCE_EASE] }),
        );
      },
      (delay + SQUEEZE_S) * 1000,
    );
    // The shadow goes a moment after it has landed; the shine and the stars are taken out when they are done.
    const landed = window.setTimeout(() => setBouncing(false), (delay + SQUEEZE_S + BOUNCE_S) * 1000 + SHADOW_STAYS_MS);
    // The first time it is back on the ground is the third beat of the jump.
    const dropped = window.setTimeout(() => dropRef.current?.(), (delay + SQUEEZE_S + BOUNCE_S * BOUNCE_TIMES[2]) * 1000);
    const shone = window.setTimeout(() => setShining(false), (delay + SQUEEZE_S + SHINE_ENDS_S) * 1000);
    return () => {
      window.clearTimeout(squeeze);
      window.clearTimeout(jump);
      window.clearTimeout(landed);
      window.clearTimeout(dropped);
      window.clearTimeout(shone);
      running.forEach((animation) => animation.stop());
      y.set(0);
      scaleX.set(1);
      scaleY.set(1);
      setBouncing(false);
      setShining(false);
    };
  }, [play, delay, y, scaleX, scaleY]);

  return (
    <div className={`relative ${className}`}>
      {/* The plain shadow on the ground where the card rests, behind it, there only while it is in the air. */}
      <span aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${bouncing ? "opacity-100" : "opacity-0"}`} style={{ borderRadius: radius, backgroundColor: SHADOW }} />
      {/* It shrinks and stretches about its middle. */}
      <motion.div className={className} style={{ y, scaleX, scaleY, transformOrigin: "50% 50%", position: "relative" }}>
        {children}
        {/* The shine: bands of white light crossing the card, clipped by its corners. */}
        {shining && (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: radius }}>
            {SHINE_PASSES.map((pass) => (
              <motion.span
                key={pass.after}
                initial={{ left: "-50%", opacity: 0 }}
                animate={{ left: ["-50%", "120%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: pass.duration, delay: SHINE_AFTER_S + pass.after, ease: "easeInOut", opacity: { duration: pass.duration, delay: SHINE_AFTER_S + pass.after, times: [0, 0.15, 0.85, 1] } }}
                className="absolute inset-y-0"
                style={{ width: pass.width, skewX: -20, backgroundImage: SHINE_BAND }}
              />
            ))}
          </span>
        )}
        {/* The stars sit inside the card, in two of its corners. */}
        {shining &&
          STARS.map((star) => {
            const place = { [star.corner[0] === "t" ? "top" : "bottom"]: star.inset, [star.corner[1] === "l" ? "left" : "right"]: star.inset };
            return (
              <motion.svg
                key={star.corner}
                aria-hidden
                viewBox="0 0 24 24"
                width={star.size}
                height={star.size}
                initial={{ scale: 0, opacity: 0, rotate: -30 }}
                animate={{ scale: [0, 1, 0.7, 0], opacity: [0, STAR_PEAK, STAR_PEAK * 0.7, 0], rotate: [-30, 0, 15, 30] }}
                transition={{ duration: STAR_S, delay: SHINE_AFTER_S + star.after, times: [0, 0.35, 0.7, 1], ease: "easeInOut" }}
                className="pointer-events-none absolute z-[3] text-[#444444] dark:text-white"
                style={place}
              >
                <path d={STAR_PATH} fill="currentColor" />
              </motion.svg>
            );
          })}
      </motion.div>
    </div>
  );
}
