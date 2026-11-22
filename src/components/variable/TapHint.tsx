"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

/** The pointing hand (`public/images/variable-module/pointing-hand.png`, 512 x 533: a white hand in a black outline, the finger to the right). */
const HAND_SRC = "/images/variable-module/pointing-hand.png";
/** How wide it is drawn (stage px), and where its fingertip is in the picture (a share of its width and height). */
const HAND_W = 50;
const HAND_H = (HAND_W * 533) / 512;
const TIP = { x: 474 / 512, y: 203 / 533 };
/**
 * The hand is turned this many degrees to the left (counter-clockwise) about its fingertip, so the finger points up and
 * to the right, as a hand reaching up from below does; the fingertip stays where it is placed.
 */
const TILT_DEG = -18;
/** Where it comes in from, before it reaches the first target: this far (px) left of and below the fingertip's place. */
const COME_FROM = { x: -28, y: 64 };

/** The timing of the demonstration (ms, and seconds for the moves). */
const START_AFTER_MS = 1000;
const FADE_IN_S = 0.18;
const MOVE_IN_S = 0.42;
const MOVE_ON_S = 0.6;
const PRESS_S = 0.08;
const RELEASE_S = 0.14;
const CLICK_HOLD_MS = 280;
const LEAVE_AFTER_MS = 300;
const LEAVE_S = 0.25;

/** A place to click: the element marked `data-hint="id"`, and how far (px) from its left edge the fingertip lands, at its middle height. */
export type TapTarget = { id: string; fromLeft: number };

type Ripple = { x: number; y: number; n: number };

/**
 * A hand that shows the learner what to tap, once, as the screen opens: it comes in, moves to the first target and
 * clicks it (the hand presses toward its fingertip and a ring spreads from the tip), moves to the next and clicks that,
 * and goes. It only draws; it takes no taps. It stops (and fades out) as soon as `active` is false, such as when the
 * learner taps something themselves. Put it in the interaction's area: it is laid over all of it.
 *
 * It plays again from the start whenever `targets` or `runKey` changes (a hint button's press bumps `runKey`, so the
 * same demonstration can be asked for again), and `startAfterMs` is how long it waits before it comes in (the screen
 * opening waits a second; an answer to a press should not).
 */
export function TapHint({ targets, active, runKey = 0, startAfterMs = START_AFTER_MS }: { targets: readonly TapTarget[]; active: boolean; runKey?: number; startAfterMs?: number }) {
  const area = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const [ripple, setRipple] = useState<Ripple | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: number[] = [];
    const running: { stop: () => void }[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
    const go = (value: typeof x, to: number, seconds: number, ease: "easeOut" | "easeInOut" = "easeInOut") => {
      const controls = animate(value, to, { duration: seconds, ease });
      running.push(controls);
      return controls;
    };

    /** Where the hand's top left must be (the area's own px) for its fingertip to be on `target`, or null if it is not on the screen. */
    const place = (target: TapTarget) => {
      const box = area.current;
      const element = document.querySelector<HTMLElement>(`[data-hint="${CSS.escape(target.id)}"]`);
      if (!box || !element) return null;
      // The stage may be scaled: a screen px is `scale` of the area's own px.
      const outer = box.getBoundingClientRect();
      const scaleOf = outer.width / box.offsetWidth || 1;
      const rect = element.getBoundingClientRect();
      const tip = { x: (rect.left - outer.left) / scaleOf + target.fromLeft, y: (rect.top + rect.height / 2 - outer.top) / scaleOf };
      return { tip, x: tip.x - TIP.x * HAND_W, y: tip.y - TIP.y * HAND_H };
    };

    /** A click at the fingertip: the hand presses toward it and lets go, and a ring spreads from the tip. */
    const click = async (tip: { x: number; y: number }) => {
      await go(scale, 0.82, PRESS_S, "easeOut");
      if (cancelled) return;
      setRipple({ ...tip, n: Date.now() });
      await go(scale, 1, RELEASE_S, "easeOut");
      await wait(CLICK_HOLD_MS);
    };

    const run = async () => {
      await wait(startAfterMs);
      const first = targets[0] && place(targets[0]);
      if (cancelled || !first) return;
      // In: from below and to the left of the first target, fading in as it moves there.
      x.set(first.x + COME_FROM.x);
      y.set(first.y + COME_FROM.y);
      scale.set(1);
      await Promise.all([go(opacity, 1, FADE_IN_S, "easeOut"), go(x, first.x, MOVE_IN_S, "easeOut"), go(y, first.y, MOVE_IN_S, "easeOut")]);
      for (let index = 0; index < targets.length; index += 1) {
        if (cancelled) return;
        const spot = place(targets[index]);
        if (!spot) return;
        if (index > 0) await Promise.all([go(x, spot.x, MOVE_ON_S), go(y, spot.y, MOVE_ON_S)]);
        if (cancelled) return;
        await click(spot.tip);
      }
      if (cancelled) return;
      await wait(LEAVE_AFTER_MS);
      go(opacity, 0, LEAVE_S, "easeOut");
    };
    void run();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      running.forEach((controls) => controls.stop());
      // Stopped by the learner (or the screen is left): the hand fades away at once.
      animate(opacity, 0, { duration: 0.15 });
    };
  }, [active, targets, runKey, startAfterMs, x, y, scale, opacity]);

  return (
    <div ref={area} aria-hidden className="pointer-events-none absolute inset-0 z-30">
      {ripple && (
        <motion.span
          key={ripple.n}
          initial={{ scale: 0.25, opacity: 0.7 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute rounded-full border-[3px] border-[#04ACAB] bg-[#04ACAB]/20"
          style={{ left: ripple.x - 18, top: ripple.y - 18, width: 36, height: 36 }}
        />
      )}
      <motion.img
        src={HAND_SRC}
        alt=""
        draggable={false}
        width={HAND_W}
        height={HAND_H}
        // Turned left about its fingertip (`TILT_DEG`); pressing shrinks the hand toward its fingertip.
        style={{ x, y, scale, rotate: TILT_DEG, opacity, width: HAND_W, height: HAND_H, transformOrigin: `${TIP.x * 100}% ${TIP.y * 100}%`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }}
        className="absolute top-0 left-0 max-w-none select-none"
      />
    </div>
  );
}
