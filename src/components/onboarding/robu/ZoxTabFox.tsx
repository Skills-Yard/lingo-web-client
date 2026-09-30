"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_IDLE_ANIMATION,
  ZOX_TAB_TYPING_ANIMATION,
} from "@/lib/rive/runtime";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same feel as the screen-to-screen crossfade, plus a rise from below: he
// fades in and slides up into his spot in the question row.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

/** Zox with his tablet, in the question row. Own canvas; the flow's fox sits
 * these screens out. He idles by default; each change of `typing` (set anew
 * on every option pick) plays his typing pass once, then he goes back to idle. */
export function ZoxTabFox({
  className,
  typing = 0,
}: {
  className?: string;
  typing?: number;
}) {
  // Set while we stop the clips ourselves to restart typing, so that stop
  // isn't mistaken for the typing pass finishing.
  const restarting = useRef(false);

  const { rive, RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    animations: ZOX_TAB_IDLE_ANIMATION,
    autoplay: true,
    layout: LAYOUT,
    onStop: (event) => {
      if (restarting.current) return;
      const names = event.data as string[];
      if (names.includes(ZOX_TAB_TYPING_ANIMATION)) {
        rive?.play(ZOX_TAB_IDLE_ANIMATION);
      }
    },
  });

  useEffect(() => {
    if (!rive || !typing) return;
    restarting.current = true;
    rive.stop([ZOX_TAB_IDLE_ANIMATION, ZOX_TAB_TYPING_ANIMATION]);
    restarting.current = false;
    rive.play(ZOX_TAB_TYPING_ANIMATION);
  }, [rive, typing]);

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
