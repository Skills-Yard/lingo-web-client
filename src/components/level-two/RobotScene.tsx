"use client";

import { motion } from "framer-motion";
import { CUBE_AT, CUBE_SIZE, LEG_S, SCENE_H, SCENE_SRC, SCENE_W, type CubeSpot } from "./rounds";

/** The picture's sky and floor colours, carried on above and below it. */
const SKY = "#D5E9FB";
const FLOOR = "#EAE4E0";
/** The picture's bottom edge sits this far (frame px) above the screen's,
 * so the table clears the button and the result card. */
const SCENE_LIFT = 70;
/** On a wide screen the picture keeps a phone's width. */
const SCENE_MAX_W = 450;

/**
 * The robot arm over its table, behind everything on the screen: pinned to
 * the bottom of the stage (lifted clear of the button), with the sky carried
 * on above it and the floor below. The cube is drawn on top of the picture,
 * at `from`, and with `go` travels through `moves`.
 */
export function RobotScene({ from, moves, go }: { from: CubeSpot; moves: readonly CubeSpot[]; go: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ backgroundColor: FLOOR }}>
      <div className="absolute inset-x-0 top-0" style={{ bottom: SCENE_LIFT, backgroundColor: SKY }} />
      <div
        className="absolute left-1/2 w-full -translate-x-1/2"
        style={{ bottom: SCENE_LIFT, maxWidth: SCENE_MAX_W, aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCENE_SRC} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
        {/* The picture's top edge fades into the sky above it. */}
        <div className="absolute inset-x-0 top-0 h-[12%]" style={{ background: `linear-gradient(${SKY}, transparent)` }} />
        <CubeShadow at={go ? moves[moves.length - 1] : from} delayS={go ? (moves.length - 1) * LEG_S : null} />
        <Cube from={from} moves={moves} go={go} />
      </div>
    </div>
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
