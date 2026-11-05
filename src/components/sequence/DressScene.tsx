"use client";

import { AnimatePresence, motion } from "framer-motion";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SceneBackdrop } from "./SceneBackdrop";
import type { RoomDress } from "./SequenceRoom";
import type { ScenePicture } from "./sequence";

/** How long putting an item on takes, in seconds. */
export const HOP_SECONDS = 1;
const CLOSE_UP_SPRING = { type: "spring", stiffness: 220, damping: 20 } as const;

/** Where an item is: on the rug, going on his feet, or on them. */
export type DressStage = "rug" | "hop" | "worn";

/** A picture in front of the scene, in a card. */
function CloseUp({ picture }: { picture: ScenePicture | null }) {
  return (
    <AnimatePresence>
      {picture && (
        <motion.div
          key={picture.src}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={CLOSE_UP_SPRING}
          className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
          style={{ top: stageTop(picture.top) }}
        >
          <div
            className="rounded-[16px] border-4 border-white bg-[#F6F4FE] p-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-[#818185] dark:bg-[#0F1F26]"
            style={{ width: picture.width }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picture.src} alt="" draggable={false} className="h-auto w-full select-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The bedroom with the socks and shoes going on, one at a time, or (with `trySocks`)
 * him trying the socks over his shoes. With a `closeUp` the room fades back behind a picture of the result.
 */
export function DressScene({ socks, shoes, trySocks = false, happy = false, closeUp = null }: { socks: DressStage; shoes: DressStage; trySocks?: boolean; happy?: boolean; closeUp?: ScenePicture | null }) {
  const dress: RoomDress = trySocks ? "trySocks" : shoes !== "rug" ? "dressed" : socks !== "rug" ? "socks" : "bare";
  return (
    <>
      <SceneBackdrop dress={dress} dimmed={!!closeUp} happy={happy} />
      <CloseUp picture={closeUp} />
    </>
  );
}
