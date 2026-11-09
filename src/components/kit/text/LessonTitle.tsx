"use client";

import { motion } from "framer-motion";
import { Markup, plainText } from "../markup";
import { TEXT } from "../tokens";

export type LessonTitleProps = {
  /** The title; `*words*` are picked out in teal ("Let's *Go*"). */
  text: string;
  /** Font size in px. By default it fits the length: 28px up to 20 letters, 24px after. */
  size?: number;
  align?: "center" | "left";
  /** Drops in with a spring when it appears (default). */
  animate?: boolean;
  /** Never wraps to a second line. */
  oneLine?: boolean;
  /** Its width as a CSS length, where it should wrap narrower than the box it stands in (default: the box). */
  width?: string;
  className?: string;
};

/** A screen's headline: Poppins-weight, centred, with its key words in the brand's teal gradient. */
export function LessonTitle({ text, size, align = "center", animate = true, oneLine = false, width, className = "" }: LessonTitleProps) {
  const fontSize = size ?? (plainText(text).length <= 20 ? 28 : 24);
  return (
    <motion.h1
      initial={animate ? { opacity: 0, y: -24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.15 }}
      // The line height is that of the full 28px size, so a smaller title keeps the room a 28px one takes (as the lesson screens' titles do).
      style={width ? { width } : undefined}
      className={`${width ? "" : "w-full"} text-[28px] ${TEXT.title} ${align === "center" ? "text-center" : "text-left"} ${oneLine ? "whitespace-nowrap" : ""} ${className}`}
    >
      <span style={{ fontSize }}>
        <Markup text={text} />
      </span>
    </motion.h1>
  );
}
