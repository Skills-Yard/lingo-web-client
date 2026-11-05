"use client";

import { motion } from "framer-motion";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SequenceRoom, type RoomDress } from "./SequenceRoom";

/** Where the room starts in the Figma frame, on every screen: Hex stands clear above the boy's head. */
const FIGMA_TOP = 250;
/** The room's drawn size (frame px): the artboard's width, and tall enough for the floor it draws below the artboard. */
const ROOM_W = 390;
const ROOM_H = 420;
/** The boy's feet, as a share of the room's height: it shrinks around them, so they stay above the cards. */
const FEET_Y = "74%";
/** As the answer cards rise, it slides up and shrinks, which leaves the boy whole between the title and them. */
const LIFT = 105;
const LIFTED_SCALE = 0.88;
/** The result panel's own spring (see FeedbackPanel). */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The room's sides fade over at most this much, on a screen wider than it. */
const SIDE_FADE = 60;

/** Fades the room into the page at its top and bottom, and at its sides only once the screen is wider than it. */
const SIDE_BAND = `min(${SIDE_FADE}px, max(0px, var(--stage-w, ${ROOM_W}px) - ${ROOM_W}px))`;
const FADE = [
  "linear-gradient(180deg, transparent 0, #000 28px, #000 calc(100% - 70px), transparent 100%)",
  `linear-gradient(90deg, transparent calc(50% - ${ROOM_W / 2}px), #000 calc(50% - ${ROOM_W / 2}px + ${SIDE_BAND}), #000 calc(50% + ${ROOM_W / 2}px - ${SIDE_BAND}), transparent calc(50% + ${ROOM_W / 2}px))`,
].join(", ");

/**
 * The bedroom behind a Sequence screen, on a soft lavender wash (light mode only;
 * the room has its own dark theme). `lifted` moves it up with the answer cards, so
 * they don't cover the scene.
 */
export function SceneBackdrop({ dress, lifted = false, happy = false }: { dress: RoomDress; lifted?: boolean; happy?: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E7FD_18%,#E9EBFE_72%,#FFFFFF_100%)] dark:hidden" />
      <motion.div
        aria-hidden
        initial={false}
        animate={{ y: lifted ? -LIFT : 0 }}
        transition={PANEL_SPRING}
        className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
        style={{ top: stageTop(FIGMA_TOP), maskImage: FADE, WebkitMaskImage: FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <motion.div
          initial={false}
          animate={{ scale: lifted ? LIFTED_SCALE : 1 }}
          transition={PANEL_SPRING}
          className="relative shrink-0"
          style={{ width: ROOM_W, height: ROOM_H, transformOrigin: `50% ${FEET_Y}` }}
        >
          <SequenceRoom dress={dress} happy={happy} />
        </motion.div>
      </motion.div>
    </>
  );
}
