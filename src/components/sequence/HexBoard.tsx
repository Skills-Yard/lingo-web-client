"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import type { Dir, HexState } from "./hexGrid";

export type BoardKind = "grid" | "row";

/** Each board's own size (px), before it is scaled to the width it is drawn at. */
const BASE = { grid: { width: 356, height: 266 }, row: { width: 356, height: 112 } } as const;

/**
 * The 3 x 3 picture is drawn in perspective, so its tile centres (a share of its width, by row then column)
 * and its rows' centres (a share of its height) are measured off it.
 */
const GRID_X = [
  [0.24, 0.497, 0.757],
  [0.22, 0.5, 0.776],
  [0.199, 0.504, 0.803],
] as const;
const GRID_Y = [0.182, 0.468, 0.765] as const;
/** The straight row's tiles, drawn in code: each is `ROW_TILE` square, `ROW_PAD` in from the rim. */
const ROW_TILE = 76;
const ROW_GAP = 8;
const ROW_PAD = 14;

type Tile = { col: number; row: number };

const centreOf = (kind: BoardKind, { col, row }: Tile) =>
  kind === "grid"
    ? { x: GRID_X[row][col] * BASE.grid.width, y: GRID_Y[row] * BASE.grid.height }
    : { x: ROW_PAD + col * (ROW_TILE + ROW_GAP) + ROW_TILE / 2, y: ROW_PAD + ROW_TILE / 2 };

/** Hex's box, centred on his tile; his artboard has room around him. */
const HEX_BOX = 100;
/** How far above the tile's centre Hex's box sits, so he stands on the tile. */
const HEX_LIFT = 10;
/** The battery's box (the picture is 145 x 132), standing on its tile. */
const BATTERY = { width: 66, height: 60, lift: 16 };
/** How far from his tile's centre the direction arrow stands (px, board scale). */
const ARROW_REACH = { grid: 40, row: 42 } as const;

/** The arrow: it points up, and is turned to the way Hex faces. */
function Arrow({ colour, faint = false }: { colour: string; faint?: boolean }) {
  return (
    <svg aria-hidden width={22} height={26} viewBox="0 0 26 30" style={{ opacity: faint ? 0.75 : 1 }}>
      <path d="M13 2 24 16h-7v12H9V16H2z" fill={colour} stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" />
    </svg>
  );
}

/** A grass tuft on a tile. */
function Tuft({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 22 18" width={16} className={`absolute ${className}`}>
      <path d="M3 17C3 11 1 8 1 5M11 17c0-8 0-12 0-16M19 17c0-6 2-9 2-12" stroke="#5AA52A" strokeWidth={3} strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** The straight row of four tiles: the first is where Hex starts. */
function RowBoard() {
  const { width, height } = BASE.row;
  return (
    <>
      <div aria-hidden className="absolute inset-x-0 top-0 rounded-[28px] bg-[#8ED03F] shadow-[0_6px_0_#6FAE2B]" style={{ height: height - 6, width }} />
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          aria-hidden
          className="absolute rounded-[14px]"
          style={{
            left: ROW_PAD + index * (ROW_TILE + ROW_GAP),
            top: ROW_PAD,
            width: ROW_TILE,
            height: ROW_TILE,
            background: index === 0 ? "#FBDBB1" : "#CCEC76",
            boxShadow: `0 5px 0 ${index === 0 ? "#D4865E" : "#589E27"}`,
          }}
        >
          <Tuft className="top-3 right-3" />
          <Tuft className="bottom-4 left-3" />
          {index < 3 && <ChevronRight className="absolute right-1.5 bottom-1.5 size-[18px] text-white/70" strokeWidth={3} />}
        </div>
      ))}
    </>
  );
}

type HexBoardProps = {
  kind: BoardKind;
  hex: HexState;
  /** The tile the battery stands on. */
  battery?: Tile | null;
  /** The battery has been taken: it shrinks away. */
  collected?: boolean;
  /** Faint arrows on a tile for directions Hex was facing or will face, to compare with the live one. */
  ghost?: { at: Tile; dirs: readonly { dir: Dir; colour: string }[] } | null;
  /** A tile ringed to draw the eye. */
  ring?: Tile | null;
  /** The width (px) the board is drawn at; its height follows. */
  width: number;
  entryKey: string;
};

/**
 * The board Hex walks on: the 3 x 3 platform picture, or a straight row of four
 * tiles drawn in code. Hex stands on his tile (an arrow beside him shows the way
 * he faces), the battery on its own; both move by spring when the state changes.
 */
export function HexBoard({ kind, hex, battery = null, collected = false, ghost = null, ring = null, width, entryKey }: HexBoardProps) {
  const base = BASE[kind];
  const scale = width / base.width;
  const at = centreOf(kind, hex);
  // The arrow turns the short way round (a right turn from "left" goes on to "up", not back three quarters).
  const [turn, setTurn] = useState(hex.dir * 90);
  const facing = (((turn / 90) % 4) + 4) % 4;
  if (facing !== hex.dir) setTurn(turn + ((hex.dir - facing + 4) % 4) * 90);

  return (
    <div className="relative shrink-0" style={{ width, height: base.height * scale }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: base.width, height: base.height, transform: `scale(${scale})` }}>
        {kind === "grid" ? <Image src="/images/sequence/hex-board.webp" alt="" fill sizes="534px" priority /> : <RowBoard />}

        {ring && (
          <motion.span
            aria-hidden
            className="absolute rounded-[18px] border-[3px] border-[#FFB300]"
            style={{ left: centreOf(kind, ring).x - 52, top: centreOf(kind, ring).y - 34, width: 104, height: 68 }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {battery && (
          <motion.div
            aria-hidden
            className="absolute"
            style={{
              left: centreOf(kind, battery).x - BATTERY.width / 2,
              top: centreOf(kind, battery).y - BATTERY.height / 2 - BATTERY.lift,
              width: BATTERY.width,
              height: BATTERY.height,
            }}
            initial={false}
            animate={collected ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(255,226,70,0.85)_0%,rgba(255,226,70,0)_70%)]" />
            <Image src="/images/battery-icon.png" alt="" fill sizes="114px" className="object-contain" />
          </motion.div>
        )}

        {ghost?.dirs.map(({ dir, colour }) => (
          <span key={dir} aria-hidden className="absolute" style={{ left: centreOf(kind, ghost.at).x, top: centreOf(kind, ghost.at).y }}>
            <span className="absolute" style={{ transform: `rotate(${dir * 90}deg)` }}>
              <span className="absolute" style={{ left: -11, top: -ARROW_REACH[kind] - 13 }}>
                <Arrow colour={colour} faint />
              </span>
            </span>
          </span>
        ))}

        <motion.div
          aria-hidden
          className="absolute top-0 left-0"
          style={{ width: HEX_BOX, height: HEX_BOX }}
          initial={false}
          animate={{ x: at.x - HEX_BOX / 2, y: at.y - HEX_BOX / 2 - HEX_LIFT }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <OnboardingHex entryKey={entryKey} />
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute top-0 left-0"
          style={{ width: 0, height: 0 }}
          initial={false}
          animate={{ x: at.x, y: at.y, rotate: turn }}
          transition={{ x: { type: "spring", stiffness: 320, damping: 30 }, y: { type: "spring", stiffness: 320, damping: 30 }, rotate: { type: "spring", stiffness: 260, damping: 22 } }}
        >
          <span className="absolute" style={{ left: -11, top: -ARROW_REACH[kind] - 13 }}>
            <Arrow colour="#04ACAB" />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
