"use client";

import { motion } from "framer-motion";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SequenceRoom, type RoomDress } from "./SequenceRoom";

/** The 390px frame every screen is laid out in; the board's `left` is from this column's left edge (the column is centred on a wider screen). */
const COLUMN_W = 390;

/** The board in the column: its Figma `top`, and its outer size (px), frame included. */
export const BOARD = { left: 110, top: 165, width: 270, height: 350 };

const SWAP: { duration: number } = { duration: 0.25 };
/** Where the board waits before it comes in: off the screen's right edge. */
const OFFSCREEN_X = 320;
const SLIDE_IN = { type: "spring", stiffness: 110, damping: 20 } as const;

/**
 * The bedroom behind a Sequence screen, shown as a picture in a soft frame: a rounded
 * window with a thin light mat round it (white in light mode, frosted in dark), a hairline
 * edge, and a faint teal-to-violet glow behind, at the screen's right. The room fills the
 * window's height and is centred across it, so the boy is in the board's middle and the
 * socks that land on the rug beside him are in view; what is wider than the window is cut off.
 * The same shared room as `SceneBackdrop` (the boy carries on from the last screen), on the
 * same soft lavender wash in light mode. `hidden` fades the board out, for something else
 * shown in its place. Until `shown` it waits off the screen's right edge, and slides in
 * when it turns on.
 */
export function RoomBoard({ dress, hidden = false, shown = true }: { dress: RoomDress; hidden?: boolean; shown?: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E7FD_18%,#E9EBFE_72%,#FFFFFF_100%)] dark:hidden" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="relative h-full shrink-0" style={{ width: COLUMN_W }}>
          <motion.div
            initial={false}
            animate={{ opacity: hidden || !shown ? 0 : 1, scale: hidden ? 0.96 : 1, x: shown ? 0 : OFFSCREEN_X }}
            transition={{ default: SWAP, x: SLIDE_IN }}
            className="absolute"
            style={{ left: BOARD.left, top: stageTop(BOARD.top), width: BOARD.width, height: BOARD.height }}
          >
            {/* The glow: a blurred wash of the app's teal and the boy's violet, a little bigger than the board. */}
            <div className="absolute -inset-2 rounded-[40px] bg-[linear-gradient(150deg,#2BC3CB_0%,#8B6CF0_100%)] opacity-40 blur-xl dark:opacity-45" />
            {/* The mat: white in light mode, frosted glass in dark, with a hairline edge. */}
            <div className="relative h-full rounded-[30px] border border-white bg-white p-2 shadow-[0_18px_36px_-16px_rgba(60,60,120,0.5)] dark:border-white/20 dark:bg-white/[0.08] dark:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.7)]">
              {/* The window: dark until the room has loaded, then the room in it. */}
              <div className="relative h-full overflow-hidden rounded-[22px] bg-[#0F1F26]">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2" style={{ aspectRatio: "390 / 420" }}>
                  <SequenceRoom dress={dress} />
                </div>
                {/* A fine line round the picture, and a little depth at its top. */}
                <div className="absolute inset-0 rounded-[22px] border border-black/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.28)] dark:border-white/10" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
