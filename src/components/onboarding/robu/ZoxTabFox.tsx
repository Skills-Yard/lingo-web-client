"use client";

import { useEffect, useState } from "react";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import { HEX_STATE, HEX_TYPING_MS, HEX_FIDGET_MS, type HexState } from "@/lib/rive/runtime";
import { useHexRive } from "./useHexRive";

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same feel as the screen-to-screen crossfade, plus a rise from below: he
// fades in and slides up into his spot in the question row.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

// [min, max] gap in ms. The fidget fires this long after the last input (an
// option pick or a new screen) and then keeps repeating while there's none.
const FIDGET_AFTER_MS = [4000, 5000] as const;

const randomBetween = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min);

/** `HEX_STATE.typing` for `HEX_TYPING_MS` each time `typing` is set anew (an option pick). */
function useTyping(typing: number) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!typing) return;
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), HEX_TYPING_MS);
    return () => window.clearTimeout(timer);
  }, [typing]);
  return active;
}

/** True for `HEX_FIDGET_MS` every so often while left alone; `restartKey` throws away the pending gap. */
function useFidget(paused: boolean, restartKey: string) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (paused) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setActive(true);
        timer = window.setTimeout(() => {
          setActive(false);
          schedule();
        }, HEX_FIDGET_MS);
      }, randomBetween(FIDGET_AFTER_MS));
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      setActive(false);
    };
  }, [paused, restartKey]);
  return active;
}

/** Hex with his tablet, in the question row. Own canvas; the flow's fox sits
 * these screens out. He holds the tablet ("HEX-Holding_Tab"), types on each
 * option pick (`typing`) and fidgets when left alone for a few seconds. */
export function ZoxTabFox({
  className,
  typing = 0,
  screenId,
}: {
  className?: string;
  /** Set anew (`Date.now()`) on every option pick. */
  typing?: number;
  /** Changes with every new screen / question. */
  screenId?: string;
}) {
  const typingNow = useTyping(typing);
  const fidgeting = useFidget(typingNow, `${typing}|${screenId}`);

  let state: HexState = HEX_STATE.tablet;
  if (typingNow) state = HEX_STATE.typing;
  else if (fidgeting) state = HEX_STATE.fidget;

  const { RiveComponent } = useHexRive(LAYOUT, state);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: SLIDE_FROM_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={ENTER}
    >
      <RiveComponent className="h-full w-full" />
    </motion.div>
  );
}
