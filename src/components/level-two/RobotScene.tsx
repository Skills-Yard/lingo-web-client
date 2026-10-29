"use client";

import { motion } from "framer-motion";
import { SlotImage } from "./SlotImage";
import { CUBE_AT, CUBE_SIZE, FRAME_TOP_SHIFT, LEG_S, SCENE_SRC, TARGET_BOX, type CubeSpot } from "./levelTwo";

/** Figma: the picture is 360 x 543 at (16, 16); the floor colour starts at 539. */
const SCENE_FRAME_W = 360;
const SCENE_FRAME_H = 543;
const SCENE_TOP = 16 - FRAME_TOP_SHIFT;
const FLOOR_TOP = 539 - FRAME_TOP_SHIFT;
const FLOOR = "#FEF0E2";
/** The picture's sky, carried on at its sides (a wide screen) and above it. */
const SKY = "#D5E9FB";

/**
 * The robot arm over its table, behind everything on the screen (the same
 * picture on every Module 2 screen): the Figma frame's "image 358" with its
 * floor colour below and the white glow ("Rectangle 226") behind the title.
 * The cube is drawn on top of the picture, at `from`, and with `go` travels
 * through `moves`.
 */
export function RobotScene({
  from,
  moves = [],
  go = false,
  target = false,
}: {
  from: CubeSpot;
  moves?: readonly CubeSpot[];
  go?: boolean;
  /** Picks out the target box: a glow, its label and the arrow pointing at it. */
  target?: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ backgroundColor: SKY }}>
      {/* The same picture, blurred, carried on past the sharp one's sides (a
        wide screen), so there is no seam where it ends. */}
      <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: FLOOR_TOP }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCENE_SRC} alt="" draggable={false} className="h-full w-full scale-110 object-cover object-top blur-[14px]" />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: SCENE_TOP, width: SCENE_FRAME_W, height: SCENE_FRAME_H }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCENE_SRC} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
        {target && <TargetCallout />}
        <CubeShadow at={go ? moves[moves.length - 1] : from} delayS={go ? (moves.length - 1) * LEG_S : null} />
        <Cube from={from} moves={moves} go={go} />
      </div>
      {/* "Rectangle 225": the floor colour, over the picture's bottom edge. */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: FLOOR_TOP, backgroundColor: FLOOR }} />
      {/* "Rectangle 226": 533 x 284 white, blurred 50px, behind the header and title. */}
      <div
        className="absolute bg-white blur-[50px]"
        style={{ left: "calc(50% - 297px)", top: -147 - FRAME_TOP_SHIFT, width: 533, height: 284 }}
      />
    </div>
  );
}

/** The target box lit up, with "TARGET AREA" under it. */
function TargetCallout() {
  return (
    <>
      <motion.div
        className="absolute rounded-[3px] bg-[#2BFFEE]/30 shadow-[0_0_14px_5px_rgba(43,255,238,0.45)]"
        style={TARGET_BOX}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
      />
      <span
        className="absolute text-[10px] leading-none font-bold tracking-[1.2px] whitespace-nowrap text-[#1386B3] italic"
        style={{ left: TARGET_BOX.left, top: `calc(${TARGET_BOX.top} + ${TARGET_BOX.height} + 6px)` }}
      >
        TARGET AREA
      </span>
      {/* The curved arrow to the box. */}
      <div className="absolute" style={{ left: "34%", top: "64%", width: "22%", height: "10%" }}>
        <SlotImage file="target-arrow.png" className="h-full w-full object-contain" />
      </div>
    </>
  );
}

/** The cube's shadow on the table under `at`: dark while it rests there,
 * faint while the arm holds it up. Moves after `delayS` (`null`: at once). */
function CubeShadow({ at, delayS }: { at: CubeSpot; delayS: number | null }) {
  const resting = at === "table" || at === "target";
  return (
    <motion.div
      className="absolute h-[2.2%] w-[17%] rounded-[50%] bg-[#1F2A44]/25 blur-[3px]"
      initial={false}
      animate={{
        left: `calc(${CUBE_AT[at].left} - 0.8%)`,
        top: at === "target" ? "74.4%" : "76.9%",
        opacity: resting ? 1 : 0.35,
        scale: resting ? 1 : 0.7,
      }}
      transition={delayS === null ? { duration: 0 } : { duration: LEG_S, delay: delayS }}
    />
  );
}

/** The cube: at `from`, and with `go` through each of `moves`, one leg each. */
function Cube({ from, moves, go }: { from: CubeSpot; moves: readonly CubeSpot[]; go: boolean }) {
  const spots = [from, ...moves];
  const keyframes = (axis: "left" | "top") => spots.map((spot) => CUBE_AT[spot][axis]);
  return (
    <motion.img
      src="/images/level-two/cube.png"
      alt=""
      draggable={false}
      className="absolute select-none"
      style={CUBE_SIZE}
      initial={false}
      animate={
        go
          ? { left: keyframes("left"), top: keyframes("top"), rotate: spots.map((_, i) => (i === 0 || i === spots.length - 1 ? 0 : -3)) }
          : { left: CUBE_AT[from].left, top: CUBE_AT[from].top, rotate: 0 }
      }
      transition={
        go
          ? { duration: moves.length * LEG_S, ease: "easeInOut", times: spots.map((_, i) => i / moves.length) }
          : { duration: 0 }
      }
    />
  );
}
