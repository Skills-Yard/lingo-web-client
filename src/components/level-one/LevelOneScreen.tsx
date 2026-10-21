"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { playClickSound } from "@/components/onboarding/clickSound";

const INTRO_AUDIO = "/audios/screen_2_audio.mpeg";
const REVEAL_AUDIO = "/audios/screen_2_box.mpeg";

/** Past this much sideways drag (px) or flick speed (px/s), a swipe flips the card. */
const SWIPE_OFFSET = 40;
const SWIPE_VELOCITY = 400;

const FLIP_SPRING = {
  type: "spring",
  stiffness: 140,
  damping: 18,
  mass: 0.9,
} as const;

/**
 * `/module?level=1&step=2` — the second screen of Module 1: "Before we write code,
 * let's learn how programmers think", a card that flips (tap, or swipe) to
 * "Programmer is a problem solver."
 */
export function LevelOneScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);

  const flip = () => {
    playClickSound();
    setIntroPlayed(true);
    setFlipped((value) => !value);
  };

  return (
    <LevelOneShell
      step={2}
      // The title line first; the back of the card has its own clip, and
      // flipping back does not bring the title line back.
      voiceover={
        flipped ? [REVEAL_AUDIO] : introPlayed ? undefined : [INTRO_AUDIO]
      }
      onBack={() => router.push(levelOneHref(1))}
      onContinue={onContinue ?? (() => router.push(levelOneHref(3)))}
    >
      <FlipCard flipped={flipped} onFlip={flip} />
    </LevelOneShell>
  );
}

/**
 * Both faces are full pictures (glow included) over a tilted sheet. The
 * "Flip the card" / "Flip back" buttons are part of the artwork, so the
 * whole card is the tap target.
 */
function FlipCard({
  flipped,
  onFlip,
}: {
  flipped: boolean;
  onFlip: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative my-auto aspect-[970/1340] w-[318px] max-w-full shrink-0 [perspective:1200px]">
      {/* The tilted sheet behind, drifting a little so the stack feels alive. */}
      <motion.img
        src="/images/level-one/flip-stack.png"
        alt=""
        aria-hidden
        draggable={false}
        animate={{
          rotate: flipped ? -3 : 0,
          scale: flipped ? 0.97 : 1,
          x: flipped ? 10 : 0,
        }}
        transition={reduceMotion ? { duration: 0 } : FLIP_SPRING}
        className="pointer-events-none absolute top-1/2 left-1/2 h-auto w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      />

      <motion.div
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Flip back" : "Flip the card"}
        aria-pressed={flipped}
        onTap={onFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        onPanEnd={(_, info) => {
          if (
            Math.abs(info.offset.x) > SWIPE_OFFSET ||
            Math.abs(info.velocity.x) > SWIPE_VELOCITY
          )
            onFlip();
        }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : FLIP_SPRING}
        style={{ transformStyle: "preserve-3d", touchAction: "pan-y" }}
        className="relative h-full w-full cursor-pointer outline-none will-change-transform"
      >
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* The artwork has a glow margin; sized so the visible card spans the 16px-margin column. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/level-one/flip-front.png"
            alt="Before we write code, let's learn how programmers think."
            draggable={false}
            className="h-auto w-[120.6%] max-w-none select-none"
          />
        </div>
        <div
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/level-one/flip-back.png"
            alt="A programmer is a problem solver. A programmer breaks down complex problems into small steps using logic and creativity."
            draggable={false}
            className="h-auto w-[113%] max-w-none select-none"
          />
        </div>
      </motion.div>
    </div>
  );
}
