"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { SlotImage } from "./SlotImage";
import { levelTwoHref } from "./levelTwo";

const CARD_W = 318;
const CARD_H = 214;
/** Figma: the card's top edge is 274px down the frame. */
const CARD_TOP = 274;
const FACE = "absolute inset-0 overflow-hidden rounded-[18px] border-2 border-white shadow-[0_6px_18px_rgba(31,42,68,0.18)]";
const HIDDEN = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

/**
 * `/module?step=10` — "Flip the card to reveal.": a card (with two
 * more behind it) that turns over when tapped, to what a command is. Next
 * unlocks once it has been turned.
 */
export function FlipCardScreen() {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(false);

  const flip = () => {
    playClickSound();
    vibrateForTap();
    setFlipped((now) => !now);
    setSeen(true);
  };

  return (
    <LevelTwoShell
      step={10}
      scene={<RobotScene from="table" />}
      ctaLabel="Next"
      ctaDisabled={!seen}
      onContinue={() => router.push(levelTwoHref(11))}
    >
      <ScreenTitle>
        Flip the card to <Teal>reveal.</Teal>
      </ScreenTitle>

      <div
        className="pointer-events-auto absolute"
        style={{ top: stageTop(CARD_TOP), left: `calc(50% - ${CARD_W / 2}px)`, width: CARD_W, height: CARD_H, perspective: 1000 }}
      >
        {/* The two cards behind. */}
        <div aria-hidden className="absolute inset-0 rotate-[2.5deg] rounded-[18px] border-2 border-white/70 bg-[#A8CAE7]/80 translate-x-2 translate-y-2" />
        <div aria-hidden className="absolute inset-0 -rotate-[1.5deg] rounded-[18px] border-2 border-white/70 bg-[#C9E6DD]/80 translate-x-1 translate-y-3.5" />

        <motion.button
          type="button"
          onClick={flip}
          aria-label={flipped ? "Hide the definition" : "Flip the card"}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0, rotateY: flipped ? 180 : 0 }}
          transition={{ opacity: { duration: 0.3 }, y: { type: "spring", stiffness: 140, damping: 16 }, rotateY: { duration: 0.6, ease: [0.45, 0, 0.25, 1] } }}
          whileTap={{ scale: 0.98 }}
          className="absolute inset-0 cursor-pointer text-left"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <span
            className={`${FACE} flex flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#D0D7FF_0%,#EEE9FF_48%,#D7E6FF_100%)]`}
            style={HIDDEN}
          >
            <span className="flex h-[64px] w-[72px] items-center justify-center">
              <SlotImage file="step-8.1.svg" className="max-h-full max-w-full object-contain" />
            </span>
            <span className="text-[20px] leading-7 font-semibold text-[#555555]">Tap to flip</span>
          </span>

          {/* Back: what a command is, with an example. */}
          <span
            className={`${FACE} flex flex-col items-center justify-center gap-2.5 bg-[linear-gradient(135deg,#E5EEFF_0%,#F3F0FF_55%,#E1EDFF_100%)] px-4`}
            style={{ ...HIDDEN, transform: "rotateY(180deg)" }}
          >
            <span className="text-center text-[16px] leading-[22px] font-bold text-[#444444]">
              <Teal>A command</Teal> is an instruction that tells a computer or robot what to do.
            </span>
            <span className="relative flex w-full items-center gap-2 rounded-xl bg-white/90 py-3 pr-3 pl-3.5">
              <span className="absolute -top-2.5 right-3 rounded-full bg-[#E3F6F3] px-2 py-0.5 text-[10px] leading-3 font-bold text-[#04ACAB]">Example</span>
              <span className="flex-1 text-[13px] leading-[19px] font-medium text-[#444444]">
                <b className="font-bold text-[#04ACAB]">Pick Up</b> tells the robot to grab the cube.
              </span>
              <span className="flex h-[60px] w-[54px] shrink-0 items-center justify-center">
                <SlotImage file="step-8.2.svg" className="max-h-full max-w-full object-contain" />
              </span>
            </span>
          </span>
        </motion.button>
      </div>
    </LevelTwoShell>
  );
}
