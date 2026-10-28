"use client";

import { motion } from "framer-motion";
import { Poppins } from "next/font/google";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { TYPE_DELAY_MS, useTyped } from "@/components/level-one/useTyped";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });

/** Hex beside his line; once `cheer` turns on he gives a thumbs up. */
export function HexSays({ entryKey, line, cheer }: { entryKey: string; line: string; cheer: boolean }) {
  return (
    <div className="mt-4 flex w-full items-center justify-between">
      <div aria-hidden className="relative h-[110px] w-[110px] shrink-0">
        <OnboardingHex entryKey={entryKey} cue={cheer ? HEX_ONBOARDING_TRIGGER.continueThumb : null} />
      </div>
      <SpeechBubble key={line}>{line}</SpeechBubble>
    </div>
  );
}

/** Hex's line (Figma "Rectangle 142": 212.5 x 86, 3px teal border over a
 * blue drop edge), its tail pointing back at him, typed in letter by letter
 * the way module 1's teacher line is. */
function SpeechBubble({ children }: { children: string }) {
  const typed = useTyped(children, true);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: TYPE_DELAY_MS / 1000 }}
      style={{ transformOrigin: "0% 50%" }}
      className="relative flex min-h-[86px] w-[212.5px] shrink-0 items-center justify-center rounded-xl border-[3px] border-[#00B8A9] bg-white px-[19.5px] py-2.5 shadow-[0_3px_0_#128CB3]"
    >
      <span
        aria-hidden
        className="absolute top-[42%] -left-[10px] h-[15px] w-[15px] -translate-y-1/2 rotate-45 rounded-bl-[3px] border-b-[3px] border-l-[3px] border-[#00B8A9] bg-white"
      />
      <p className={`${poppins.className} relative text-center text-[16px] leading-[1.24] font-medium text-[#444444]`}>
        {/* The whole line is laid out from the start (the rest unseen), so
          centred lines never shift as letters arrive. */}
        {typed}
        <span className="invisible">{children.slice(typed.length)}</span>
      </p>
    </motion.div>
  );
}
