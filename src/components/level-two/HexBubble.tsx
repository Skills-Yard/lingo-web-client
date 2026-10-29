"use client";

import { motion } from "framer-motion";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { TYPE_DELAY_MS, useTyped } from "@/components/level-one/useTyped";
import type { BubbleSize, Span } from "./levelTwo";

/** Hex's slot, the one Module 2's old screens gave him. */
export const HEX_SLOT = 110;

type HexBubbleProps = {
  entryKey: string;
  /** Which side Hex stands on; the bubble's tail points back at him. */
  hex: "left" | "right";
  line: readonly Span[];
  size: BubbleSize;
  /** A trigger Hex plays once he has entered. */
  cue?: string | null;
};

/** Hex beside his line: the line is typed in letter by letter, the way module
 * 1's teacher line is. */
export function HexBubble({ entryKey, hex, line, size, cue = null }: HexBubbleProps) {
  const hexAtLeft = hex === "left";
  return (
    <div className={`flex w-fit items-center ${hexAtLeft ? "" : "flex-row-reverse"}`}>
      <div aria-hidden className="relative shrink-0" style={{ width: HEX_SLOT, height: HEX_SLOT }}>
        <OnboardingHex entryKey={entryKey} cue={cue} />
      </div>
      <SpeechBubble key={line.map((span) => span.text).join("")} line={line} size={size} tailAtLeft={hexAtLeft} />
    </div>
  );
}

/** The bubble's own look: a 3px teal border over a blue drop edge (the Figma
 * "Rectangle 142" and the onboarding's), its tail pointing at Hex. */
function SpeechBubble({ line, size, tailAtLeft }: { line: readonly Span[]; size: BubbleSize; tailAtLeft: boolean }) {
  const typed = useTyped(line.map((span) => span.text).join(""), true);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: tailAtLeft ? -8 : 8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: TYPE_DELAY_MS / 1000 }}
      // Figma: the short bubble ("Rectangle 142") is 77 tall with its text 9px in; the others 86.
      style={{ transformOrigin: tailAtLeft ? "0% 50%" : "100% 50%", width: size.width, minHeight: size.minHeight }}
      className={`relative flex shrink-0 items-center justify-center rounded-xl border-[3px] border-[#00B8A9] bg-white px-[9px] shadow-[0_3px_0_#128CB3] ${
        size.minHeight ? "py-1" : size.short ? "min-h-[77px] py-[7px]" : "min-h-[86px] py-2.5"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[42%] h-[15px] w-[15px] -translate-y-1/2 rotate-45 bg-white ${
          tailAtLeft
            ? "-left-[10px] rounded-bl-[3px] border-b-[3px] border-l-[3px] border-[#00B8A9]"
            : "-right-[10px] rounded-tr-[3px] border-t-[3px] border-r-[3px] border-[#00B8A9]"
        }`}
      />
      <p className="relative text-center text-[16px] leading-[1.24] font-medium text-[#444444]">
        {/* The whole line is laid out from the start (the rest unseen), so
          centred lines never shift as letters arrive. */}
        {line.map((span, i) => {
          // How many of this span's letters have been typed so far.
          const before = line.slice(0, i).reduce((sum, earlier) => sum + earlier.text.length, 0);
          const seen = Math.max(0, Math.min(span.text.length, typed.length - before));
          return (
            <span key={i} className={span.teal ? "text-[#04ACAB]" : undefined}>
              {span.text.slice(0, seen)}
              <span className="invisible">{span.text.slice(seen)}</span>
            </span>
          );
        })}
      </p>
    </motion.div>
  );
}
