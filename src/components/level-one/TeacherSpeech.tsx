"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OnboardingHex } from "./FeedbackPanel";
import { LEAVE_FADE_DELAY_S } from "./HexStage";
import { useLevelVoice } from "./LevelVoice";

const LINE = "Open Your Notebook";

/** Once the voiceover starts, how long until the line it ends on ("open your
 * notebook"). Tune to the clip. */
const CUE_AFTER_VOICE_MS = 2800;
/** With no voice to wait for (it failed to play), the cue comes this long after mount. */
const CUE_WITHOUT_VOICE_MS = 6000;
/** The delay before the first letter, so Hex has started moving. */
const TYPE_DELAY_MS = 350;
const TYPE_STEP_MS = 55;

const HEX_SIZE = 130;
/** Hex's spots on the picture (px from its top left, 358px wide): standing
 * below it, then up under the speech bubble in the top right corner. He
 * rises into the first from a little further down. */
const HEX_BELOW = { x: 114, y: 362 };
const HEX_ENTER_FROM = { x: 114, y: 420 };
const HEX_BESIDE = { x: 228, y: 84 };
/** The hint: a smaller Hex standing on the top edge of the right-hand option
 * card (which starts 264px down, with the picture cropped to 240px). */
const HEX_AT_CARD = { x: 262, y: 198, scale: 80 / HEX_SIZE };
/** Once next to the bubble he floats up and down. */
const HEX_FLOAT = { y: [0, -7, 0] };
const HEX_FLOAT_TRANSITION = { duration: 2.4, ease: "easeInOut", repeat: Infinity } as const;
/** The quicker, better-damped trip to the hinted card, timed to land as its flip stops. */
const HEX_HINT_MOVE = { type: "spring", stiffness: 170, damping: 24, mass: 0.9 } as const;
const HEX_MOVE = { type: "spring", stiffness: 70, damping: 16, mass: 1 } as const;

/** The characters of `text` shown so far, one more every `TYPE_STEP_MS` once `active`. */
const useTyped = (text: string, active: boolean) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let timer: number;
    const next = (n: number) => {
      setCount(n);
      if (n < text.length) timer = window.setTimeout(() => next(n + 1), TYPE_STEP_MS);
    };
    timer = window.setTimeout(() => next(1), TYPE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [text, active]);
  return text.slice(0, count);
};

/**
 * Hex and the teacher's line. Hex stands below the picture while the voice
 * introduces it; at "open your notebook" he comes up beside the teacher and the
 * line types itself into a speech bubble. Positioned over the picture's box.
 */
export function TeacherSpeech({
  hexAway = false,
  hexToCard = false,
  skipIntro = false,
}: {
  hexAway?: boolean;
  hexToCard?: boolean;
  /** The screen was opened straight on the quiz: no voice intro to wait for,
   * so Hex is already beside the bubble and the line types at once. */
  skipIntro?: boolean;
}) {
  const { speaking } = useLevelVoice();
  const [cued, setCued] = useState(skipIntro);
  // Jumping to the quiz while Hex is still waiting below the picture: skip the rest of the intro.
  if (skipIntro && !cued) setCued(true);
  // Hex leaves when an option is picked. If he is asked back (the quiz starts
  // over) he is a fresh Hex, so the one that left is not reused.
  const [hexRun, setHexRun] = useState(0);
  const [wasAway, setWasAway] = useState(hexAway);
  if (hexAway !== wasAway) {
    setWasAway(hexAway);
    if (!hexAway) setHexRun((run) => run + 1);
  }

  useEffect(() => {
    if (cued) return;
    const timer = window.setTimeout(() => setCued(true), speaking ? CUE_AFTER_VOICE_MS : CUE_WITHOUT_VOICE_MS);
    return () => window.clearTimeout(timer);
  }, [speaking, cued]);

  const typed = useTyped(LINE, cued);

  return (
    <>
      <motion.div
        aria-hidden={!cued}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={cued ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.25, delay: TYPE_DELAY_MS / 1000 }}
        style={{ transformOrigin: "100% 0%" }}
        className="pointer-events-none absolute top-5 right-5 z-10"
      >
        <div className="relative rounded-[18px] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.12)]">
          <span className="absolute top-1.5 left-3 text-[22px] leading-none font-bold text-[#FF8D42]">&ldquo;</span>
          <span className="absolute right-3 bottom-0 text-[22px] leading-none font-bold text-[#FF8D42]">&rdquo;</span>
          <p className="relative mt-4 w-[104px] text-[16px] leading-[1.3] font-semibold text-[#2C2C2C]">
            {/* The full line, unseen, holds the bubble at its final size. */}
            <span className="invisible">{LINE}</span>
            <span className="absolute inset-0">{typed}</span>
          </p>
          <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
        </div>
      </motion.div>

      <motion.div
        key={hexRun}
        aria-hidden
        initial={{ opacity: 0, ...(skipIntro ? HEX_BESIDE : HEX_ENTER_FROM) }}
        animate={{
          opacity: hexAway ? 0 : 1,
          ...(hexToCard ? HEX_AT_CARD : { ...(cued ? HEX_BESIDE : HEX_BELOW), scale: 1 }),
        }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{
          opacity: hexAway ? { delay: LEAVE_FADE_DELAY_S, duration: 0.15 } : { duration: 0.2 },
          x: hexToCard ? HEX_HINT_MOVE : HEX_MOVE,
          y: hexToCard ? HEX_HINT_MOVE : HEX_MOVE,
          scale: hexToCard ? HEX_HINT_MOVE : HEX_MOVE,
        }}
        style={{ width: HEX_SIZE, height: HEX_SIZE, transformOrigin: "0 0" }}
        className="pointer-events-none absolute top-0 left-0 z-20"
      >
        <motion.div
          animate={cued ? HEX_FLOAT : { y: 0 }}
          transition={cued ? { ...HEX_FLOAT_TRANSITION, delay: 1.2 } : { duration: 0.2 }}
          className="h-full w-full"
        >
          <OnboardingHex entryKey="teacher" leaving={hexAway} />
        </motion.div>
      </motion.div>
    </>
  );
}
