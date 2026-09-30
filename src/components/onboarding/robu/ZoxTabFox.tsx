"use client";

import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { motion } from "framer-motion";
import {
  configureRiveRuntime,
  ZOX_TAB_RIVE_SRC,
  ZOX_TAB_ARTBOARD,
  ZOX_TAB_STATE_MACHINE,
} from "@/lib/rive/runtime";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Same feel as the screen-to-screen crossfade, plus a rise from below: he
// fades in and slides up into his spot in the question row.
const SLIDE_FROM_PX = 28;
const ENTER = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

/** Zox with his tablet, in the question row. Own canvas; the flow's fox sits
 * these screens out. */
export function ZoxTabFox({ className }: { className?: string }) {
  const { RiveComponent } = useRive({
    src: ZOX_TAB_RIVE_SRC,
    artboard: ZOX_TAB_ARTBOARD,
    stateMachines: ZOX_TAB_STATE_MACHINE,
    autoplay: true,
    layout: LAYOUT,
  });

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
