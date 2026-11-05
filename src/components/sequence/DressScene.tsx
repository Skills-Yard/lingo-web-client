"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { stageTop } from "@/components/level-two/LevelTwoShell";
import { SceneBackdrop } from "./SceneBackdrop";
import { GETTING_READY_SCENE, IMAGES, type ScenePicture } from "./sequence";

/** Where things are in the sofa scene, as a share of the picture's width and height. */
const SOCKS_AT = { x: 0.25, y: 0.713 };
const SHOES_AT = { x: 0.77, y: 0.713 };
const FEET_AT = { x: 0.505, y: 0.672 };
/** The pictures' widths over the scene (a share of its width). */
const SOCKS_WIDTH = "20%";
const SHOES_WIDTH = "26%";
/** How long the hop to his feet takes, in seconds. */
export const HOP_SECONDS = 1;
const CLOSE_UP_SPRING = { type: "spring", stiffness: 220, damping: 20 } as const;
/** The sparkles' directions (radians) around the spot they burst from. */
const STARS = [0, 1, 2, 3, 4, 5].map((n) => (n / 6) * Math.PI * 2 + 0.4);

const pct = (share: number) => `${share * 100}%`;

/** Where an item is: on the rug, hopping to his feet, or on them. */
export type DressStage = "rug" | "hop" | "worn";

/** A copy of the picture that lifts off from where the item lies and lands on his feet. */
function Mover({ file, width, from, stage }: { file: string; width: string; from: { x: number; y: number }; stage: DressStage }) {
  const target =
    stage === "rug"
      ? { left: pct(from.x), top: pct(from.y), scale: 1, opacity: 0 }
      : stage === "hop"
        ? {
            left: [pct(from.x), pct((from.x + FEET_AT.x) / 2), pct(FEET_AT.x)],
            top: [pct(from.y), pct(Math.min(from.y, FEET_AT.y) - 0.13), pct(FEET_AT.y)],
            scale: [1, 1.18, 1],
            opacity: [1, 1, 1],
          }
        : { left: pct(FEET_AT.x), top: pct(FEET_AT.y), scale: 1, opacity: 1 };
  return (
    <motion.img
      src={`${IMAGES}/${file}`}
      alt=""
      draggable={false}
      initial={false}
      animate={target}
      transition={stage === "hop" ? { duration: HOP_SECONDS, times: [0, 0.45, 1], ease: "easeInOut" } : { duration: 0 }}
      className="pointer-events-none absolute h-auto select-none"
      style={{ width, x: "-50%", y: "-50%" }}
    />
  );
}

/** A burst of sparkles where the item lands. */
function Burst({ delay }: { delay: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ left: pct(FEET_AT.x), top: pct(FEET_AT.y) }}>
      {STARS.map((angle, index) => (
        <motion.span
          key={index}
          className="absolute -mt-2 -ml-2"
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.1, 0.4], x: Math.cos(angle) * 52, y: Math.sin(angle) * 36 }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        >
          <Sparkle className="size-4 fill-[#FFC93C] text-[#FFB300]" />
        </motion.span>
      ))}
    </span>
  );
}

/** A picture in front of the scene, in a card; it can bounce on the spot. */
function CloseUp({ picture, bounce }: { picture: ScenePicture | null; bounce: boolean }) {
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
          <motion.div
            animate={{ y: bounce ? [0, -12, 0] : 0 }}
            transition={bounce ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            className="rounded-[16px] border-4 border-white bg-[#F6F4FE] p-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent dark:bg-[#0F1F26]"
            style={{ width: picture.width }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picture.src} alt="" draggable={false} className="h-auto w-full select-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The sofa scene with the socks and shoes that go on: a copy of each lifts off
 * the rug and lands on his feet (`hop`), and stays there (`worn`). With a
 * `closeUp` the scene fades back behind a picture of the result.
 */
export function DressScene({ socks, shoes, closeUp = null, bounce = false }: { socks: DressStage; shoes: DressStage; closeUp?: ScenePicture | null; bounce?: boolean }) {
  return (
    <>
      <SceneBackdrop src={GETTING_READY_SCENE} dimmed={!!closeUp}>
        <Mover file="put-on-socks.webp" width={SOCKS_WIDTH} from={SOCKS_AT} stage={socks} />
        <Mover file="put-on-shoes.webp" width={SHOES_WIDTH} from={SHOES_AT} stage={shoes} />
        {socks === "hop" && <Burst delay={HOP_SECONDS * 0.85} />}
        {shoes === "hop" && <Burst delay={HOP_SECONDS * 0.85} />}
      </SceneBackdrop>
      <CloseUp picture={closeUp} bounce={bounce} />
    </>
  );
}
