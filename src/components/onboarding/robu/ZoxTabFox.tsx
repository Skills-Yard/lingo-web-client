"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, type Rive } from "@rive-app/canvas";
import { motion } from "framer-motion";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_IDLE_ANIMATION,
  ZOX_TAB_EAR_ANIMATION,
  ZOX_TAB_BLINK_ANIMATION,
  ZOX_TAB_TAB_OUT_ANIMATION,
  ZOX_TAB_FACE_START_ANIMATION,
  ZOX_TAB_FACE_END_ANIMATION,
  ZOX_TAB_TYPING_ANIMATION,
} from "@/lib/rive/runtime";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same feel as the screen-to-screen crossfade, plus a rise from below: he
// fades in and slides up into his spot in the question row.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

// Ear flick and blink fire at random, each within its own range of seconds.
const BLINK_EVERY_MS = [2000, 5000] as const;
const EAR_EVERY_MS = [4000, 9000] as const;

const randomBetween = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min);

/** Where he is in the tablet routine. */
type Phase =
  | "tab-out" // taking the tablet out (once, when the question screen opens)
  | "face-turning" // face-turning start, looping until an option is picked
  | "face-back" // face-turning end, after a pick
  | "typing"; // typing, then back to face-turning

/** Zox with his tablet, in the question row. Own canvas; the flow's fox sits
 * these screens out. He idles (small loop) with random ear flicks and blinks.
 * On arrival he takes the tablet out, then keeps turning his face until an
 * option is picked (each change of `typing`): face turns back, he types, then
 * turns again. Another pick while typing just restarts the typing. */
export function ZoxTabFox({
  className,
  typing = 0,
}: {
  className?: string;
  typing?: number;
}) {
  const phase = useRef<Phase>("tab-out");
  // A pick that came in while the tablet was still coming out.
  const pickedEarly = useRef(false);
  // Set while we stop typing ourselves to restart it, so that stop isn't
  // mistaken for the typing pass finishing.
  const restarting = useRef(false);
  const riveRef = useRef<Rive | null>(null);

  const { rive, RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    animations: [ZOX_TAB_IDLE_ANIMATION, ZOX_TAB_TAB_OUT_ANIMATION],
    autoplay: true,
    layout: LAYOUT,
    onStop: (event) => {
      const r = riveRef.current;
      if (!r || restarting.current) return;
      const names = event.data as string[];

      if (names.includes(ZOX_TAB_IDLE_ANIMATION)) r.play(ZOX_TAB_IDLE_ANIMATION);

      if (phase.current === "tab-out" && names.includes(ZOX_TAB_TAB_OUT_ANIMATION)) {
        if (pickedEarly.current) {
          phase.current = "face-back";
          r.play(ZOX_TAB_FACE_END_ANIMATION);
        } else {
          phase.current = "face-turning";
          r.play(ZOX_TAB_FACE_START_ANIMATION);
        }
      } else if (phase.current === "face-turning" && names.includes(ZOX_TAB_FACE_START_ANIMATION)) {
        r.play(ZOX_TAB_FACE_START_ANIMATION);
      } else if (phase.current === "face-back" && names.includes(ZOX_TAB_FACE_END_ANIMATION)) {
        phase.current = "typing";
        r.play(ZOX_TAB_TYPING_ANIMATION);
      } else if (phase.current === "typing" && names.includes(ZOX_TAB_TYPING_ANIMATION)) {
        phase.current = "face-turning";
        r.play(ZOX_TAB_FACE_START_ANIMATION);
      }
    },
  });
  riveRef.current = rive;

  useEffect(() => {
    if (!rive || !typing) return;
    switch (phase.current) {
      case "tab-out":
        pickedEarly.current = true;
        break;
      case "face-turning":
        phase.current = "face-back";
        rive.stop(ZOX_TAB_FACE_START_ANIMATION);
        rive.play(ZOX_TAB_FACE_END_ANIMATION);
        break;
      case "typing":
        restarting.current = true;
        rive.stop(ZOX_TAB_TYPING_ANIMATION);
        restarting.current = false;
        rive.play(ZOX_TAB_TYPING_ANIMATION);
        break;
      case "face-back":
        break;
    }
  }, [rive, typing]);

  useEffect(() => {
    if (!rive) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const flickerRandomly = (name: string, range: readonly [number, number]) => {
      const schedule = () => {
        timers.push(
          setTimeout(() => {
            if (!rive.playingAnimationNames.includes(name)) rive.play(name);
            schedule();
          }, randomBetween(range)),
        );
      };
      schedule();
    };
    flickerRandomly(ZOX_TAB_BLINK_ANIMATION, BLINK_EVERY_MS);
    flickerRandomly(ZOX_TAB_EAR_ANIMATION, EAR_EVERY_MS);
    return () => timers.forEach(clearTimeout);
  }, [rive]);

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
