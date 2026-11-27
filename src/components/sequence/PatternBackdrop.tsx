"use client";

import { stageTop } from "@/components/level-two/LevelTwoShell";

/*
 * The background of the 3D question screens' "tray" look (Figma `sequence_3`): a lavender
 * wash fading down from the top, a violet spotlight behind the character, five faint
 * question marks and a grid of dots that fades towards the bottom. Light mode only (dark mode
 * keeps the plain screen, as the other backdrops do). Laid out in the 390px column, from
 * the Figma numbers (`top` in Figma frame px).
 */

const COLUMN_W = 390;
const VIOLET = "93, 76, 254";

/** The question marks: where (Figma left/top), how big, how it is turned, and how faint. */
const MARKS = [
  { left: 224.16, top: 70, size: 150, turn: 12, opacity: 0.06 },
  { left: -26, top: 287.18, size: 110, turn: -14, opacity: 0.05 },
  { left: 279.82, top: 520, size: 120, turn: 8, opacity: 0.05 },
  { left: 20, top: 627.95, size: 80, turn: -18, opacity: 0.05 },
  { left: 166.57, top: 760, size: 70, turn: 16, opacity: 0.04 },
] as const;

/** The dots: 2.4 px, every 22 px, 18 across and 17 down from Figma (11, 470), fading from .10 to .04. */
const DOT_PITCH = 22;
const DOT_SIZE = 2.4;
const DOTS = { left: 11 - (DOT_PITCH - DOT_SIZE) / 2, top: 470 - (DOT_PITCH - DOT_SIZE) / 2, rows: 17 };
const DOT_GRID = `radial-gradient(circle, rgba(${VIOLET}, 0.1) ${DOT_SIZE / 2}px, transparent ${DOT_SIZE / 2 + 0.4}px)`;
const DOT_FADE = "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.4) 100%)";

export function PatternBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden dark:hidden">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,#EFEAFC_0%,rgba(239,234,252,0)_100%)]" />
      <div className="absolute inset-0 flex justify-center">
        <div className="relative h-full shrink-0" style={{ width: COLUMN_W }}>
          <div
            className="absolute"
            style={{
              left: -85,
              top: stageTop(20),
              width: 560,
              height: 420,
              background: `radial-gradient(50% 50% at 50% 50%, rgba(${VIOLET}, 0.14) 0%, rgba(${VIOLET}, 0) 100%)`,
            }}
          />
          {MARKS.map(({ left, top, size, turn, opacity }) => (
            <span
              key={top}
              className="absolute font-bold text-[#5D4CFE]"
              style={{ left, top: stageTop(top), fontSize: size, lineHeight: `${Math.round(size * 1.21)}px`, opacity, transform: `rotate(${turn}deg)` }}
            >
              ?
            </span>
          ))}
          <div
            className="absolute"
            style={{
              left: DOTS.left,
              top: stageTop(DOTS.top),
              width: COLUMN_W - DOTS.left,
              height: DOTS.rows * DOT_PITCH,
              backgroundImage: DOT_GRID,
              backgroundSize: `${DOT_PITCH}px ${DOT_PITCH}px`,
              maskImage: DOT_FADE,
              WebkitMaskImage: DOT_FADE,
            }}
          />
        </div>
      </div>
    </div>
  );
}
