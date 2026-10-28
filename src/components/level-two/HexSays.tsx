"use client";

import { motion } from "framer-motion";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { TYPE_DELAY_MS, useTyped } from "@/components/level-one/useTyped";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";

/** Hex beside his line; once `cheer` turns on he gives a thumbs up. */
export function HexSays({ entryKey, line, cheer }: { entryKey: string; line: string; cheer: boolean }) {
  return (
    <div className="mt-4 flex w-full items-center gap-2">
      <div aria-hidden className="relative h-[92px] w-[92px] shrink-0">
        <OnboardingHex entryKey={entryKey} cue={cheer ? HEX_ONBOARDING_TRIGGER.continueThumb : null} />
      </div>
      <SpeechBubble key={line}>{line}</SpeechBubble>
    </div>
  );
}

/** Hex's line, in a bubble whose tail points back at him, typed in letter by
 * letter the way module 1's teacher line is. */
function SpeechBubble({ children }: { children: string }) {
  const typed = useTyped(children, true);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: TYPE_DELAY_MS / 1000 }}
      style={{ transformOrigin: "0% 50%" }}
      className="relative min-w-0 flex-1 rounded-xl border-[1.5px] border-[#04ACAB] bg-white px-3 py-2.5 shadow-[0_4px_12px_rgba(4,172,171,0.12)]"
    >
      <span
        aria-hidden
        className="absolute top-1/2 -left-[7px] h-3 w-3 -translate-y-1/2 rotate-45 border-b-[1.5px] border-l-[1.5px] border-[#04ACAB] bg-white"
      />
      <p className="relative text-[13px] leading-[18px] font-medium text-[#2C2C2C]">
        {/* The full line, unseen, holds the bubble at its final size. */}
        <span className="invisible">{children}</span>
        <span className="absolute inset-0">{typed}</span>
      </p>
    </motion.div>
  );
}
