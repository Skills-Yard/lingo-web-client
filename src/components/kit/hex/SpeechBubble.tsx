"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TYPE_DELAY_MS, useTyped } from "@/components/level-one/useTyped";
import { Markup, plainText } from "../markup";

export type SpeechBubbleProps = {
  /** What is said; `*words*` in teal. */
  text: string;
  /** Which side the tail is on, pointing at whoever speaks. `none` draws no tail. */
  tail?: "left" | "right" | "top" | "none";
  /** The bubble's width (px); a narrower screen takes from it. */
  width?: number;
  /** The words are typed in letter by letter. */
  typed?: boolean;
  /** Called once, when the last letter is in. */
  onSpoken?: () => void;
  className?: string;
};

/** A white speech bubble with its soft blue edge and a tail. (For Hex with his bubble, use `HexGuide`.) */
export function SpeechBubble({ text, tail = "left", width = 240, typed = false, onSpoken, className = "" }: SpeechBubbleProps) {
  const plain = plainText(text);
  const timed = useTyped(plain, typed);
  const shown = typed ? timed.length : plain.length;
  const done = plain.length > 0 && shown >= plain.length;
  // The words are said once; the caller keys the bubble by its text, so a new line starts over.
  const onSpokenRef = useRef(onSpoken);
  useEffect(() => {
    onSpokenRef.current = onSpoken;
  });
  useEffect(() => {
    if (typed && done) onSpokenRef.current?.();
  }, [typed, done]);
  const offset = tail === "top" ? { x: 0, y: -8 } : { x: tail === "left" ? -8 : tail === "right" ? 8 : 0, y: 0 };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, ...offset }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: typed ? TYPE_DELAY_MS / 1000 : 0 }}
      style={{ width, transformOrigin: tail === "top" ? "50% 0%" : tail === "left" ? "0% 50%" : tail === "right" ? "100% 50%" : "50% 50%" }}
      className={`relative flex min-h-[86px] min-w-0 max-w-full items-center justify-center rounded-[10px] bg-white px-3 py-[13px] drop-shadow-[0_3px_0_rgba(18,140,179,0.5)] dark:bg-[#1A1C22] ${className}`}
    >
      {tail !== "none" && (
        <span
          aria-hidden
          className={`absolute h-[15px] w-[15px] rotate-45 bg-white dark:bg-[#1A1C22] ${
            tail === "top" ? "-top-[7px] left-1/2 -ml-[7px] rounded-tl-[3px]" : tail === "left" ? "top-1/2 -left-[7px] -translate-y-1/2 rounded-bl-[3px]" : "top-1/2 -right-[7px] -translate-y-1/2 rounded-tr-[3px]"
          }`}
        />
      )}
      <p className="relative text-center text-[16px] leading-[1.24] font-medium text-[#444444] dark:text-white">
        {/* The whole line is laid out from the start (the rest unseen), so centred lines never shift as letters arrive. */}
        <Markup text={text} visible={shown} tealClassName="text-[#04ACAB]" />
      </p>
    </motion.div>
  );
}
