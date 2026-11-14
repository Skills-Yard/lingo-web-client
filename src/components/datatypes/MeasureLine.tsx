"use client";

import { motion } from "framer-motion";

/**
 * A small straight line that measures 4 cm, drawn in code (no artboard, no picture), standing up: a mark for every
 * 0.1 cm, longer for each half and longest for each whole centimetre, and only the whole ones are numbered (1, 2, 3, 4).
 * The ends (0 and 4) are closed by a short line across, one at the top and one at the bottom. It is the example of
 * what an integer is: the numbered marks are the whole numbers, the unnumbered ones in between are not.
 */

/** How long a centimetre is (px). */
const CM = 66;
/** The measure: 4 cm in tenths. */
const TENTHS = 40;
/** The line's own x, the ticks' lengths (to its right) by kind, and their widths. */
const LINE_X = 6;
const TICK = {
  whole: { length: 30, width: 2.5 },
  half: { length: 20, width: 2 },
  tenth: { length: 11, width: 1.5 },
} as const;
/** The closing line at each end is longer than any tick, and reaches to both sides of the line. */
const CAP = { left: 12, right: 38, width: 3 } as const;
/** Where the numbers start (x): clear of the longest line, which is the closing one. */
const LABEL_X = LINE_X + CAP.right + 8;
const PAD = 8;
const WIDTH = LABEL_X + 22;
const HEIGHT = (TENTHS / 10) * CM + PAD * 2;

const y = (tenth: number) => PAD + (tenth / 10) * CM;

/** The 4 cm line, numbered 1 to 4 at the whole marks; it draws itself in once `shown` turns on. */
export function MeasureLine({ shown }: { shown: boolean }) {
  const ticks = Array.from({ length: TENTHS + 1 }, (_, tenth) => tenth);
  return (
    <motion.svg
      role="img"
      aria-label="A line measuring 4 centimetres, numbered 1, 2, 3 and 4"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      initial={false}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="text-[#444444] dark:text-white"
      style={{ overflow: "visible" }}
    >
      {/* The line, drawn from its top end to its bottom. */}
      <motion.line
        x1={LINE_X}
        x2={LINE_X}
        y1={y(0)}
        y2={y(TENTHS)}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: shown ? 1 : 0 }}
        transition={{ duration: 0.9, ease: [0.45, 0, 0.2, 1] }}
      />
      {ticks.map((tenth) => {
        const end = tenth === 0 || tenth === TENTHS;
        const kind = tenth % 10 === 0 ? "whole" : tenth % 5 === 0 ? "half" : "tenth";
        const { length, width } = TICK[kind];
        return (
          <motion.line
            key={tenth}
            x1={end ? LINE_X - CAP.left : LINE_X}
            x2={end ? LINE_X + CAP.right : LINE_X + length}
            y1={y(tenth)}
            y2={y(tenth)}
            stroke="currentColor"
            strokeWidth={end ? CAP.width : width}
            strokeLinecap="round"
            initial={false}
            animate={{ opacity: shown ? 1 : 0 }}
            // Each mark comes in as the line reaches it.
            transition={{ duration: 0.2, delay: shown ? 0.1 + (tenth / TENTHS) * 0.8 : 0 }}
          />
        );
      })}
      {/* Only the whole centimetres are numbered. */}
      {[1, 2, 3, 4].map((cm) => (
        <motion.text
          key={cm}
          x={LABEL_X}
          y={y(cm * 10)}
          dominantBaseline="central"
          fill="currentColor"
          fontSize={20}
          fontWeight={600}
          initial={false}
          animate={{ opacity: shown ? 1 : 0 }}
          transition={{ duration: 0.25, delay: shown ? 0.1 + ((cm * 10) / TENTHS) * 0.8 : 0 }}
        >
          {cm}
        </motion.text>
      ))}
    </motion.svg>
  );
}
