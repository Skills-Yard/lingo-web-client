"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { stageTop } from "@/components/level-two/LevelTwoShell";

/** Where the picture starts in the Figma frame: low enough that Hex's row clears the poster. */
const FIGMA_TOP = 125;
/** How far it slides up with the answer cards (px), which leaves the boy whole above them. */
const LIFT = 105;
/** The result panel's own spring (see FeedbackPanel). */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The widest the picture is drawn (frame px); on a wider screen its sides fade out. */
const MAX_W = 520;
/** How faint the picture is while something else is shown over it. */
const DIMMED_OPACITY = 0.2;

/** Fades the picture into the page at its top and bottom, and at its sides once the screen is wider than it. */
const FADE = [
  "linear-gradient(180deg, transparent 40px, #000 170px, #000 calc(100% - 90px), transparent 100%)",
  `linear-gradient(90deg, transparent calc(50% - ${MAX_W / 2}px), #000 calc(50% - ${MAX_W / 2 - 60}px), #000 calc(50% + ${MAX_W / 2 - 60}px), transparent calc(50% + ${MAX_W / 2}px))`,
].join(", ");

/**
 * A full-width illustration behind a Sequence screen, on a soft lavender wash
 * (light mode only). The art is drawn for a light page, so dark mode dims it.
 * `lifted` slides it up with the answer cards, so they don't cover the scene;
 * `dimmed` leaves it faint behind a picture shown over it. `children` are laid
 * over the picture itself (positioned by a share of its width and height), so
 * they stay on the spot they mark whatever the screen's size.
 */
export function SceneBackdrop({ src, lifted = false, dimmed = false, children }: { src: string; lifted?: boolean; dimmed?: boolean; children?: ReactNode }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E7FD_18%,#E9EBFE_72%,#FFFFFF_100%)] dark:hidden" />
      <motion.div
        aria-hidden
        initial={false}
        animate={{ y: lifted ? -LIFT : 0, opacity: dimmed ? DIMMED_OPACITY : 1 }}
        transition={PANEL_SPRING}
        className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
        style={{ top: stageTop(FIGMA_TOP), maskImage: FADE, WebkitMaskImage: FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <div className="relative w-full" style={{ maxWidth: MAX_W }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="block h-auto w-full select-none dark:brightness-[0.6]" />
          {children}
        </div>
      </motion.div>
    </>
  );
}
