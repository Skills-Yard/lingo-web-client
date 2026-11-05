"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Hand, Lightbulb, Volume2 } from "lucide-react";
import { useLevelMuted } from "@/components/level-one/levelMuted";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, Teal } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";

/** The explanation read aloud. It isn't recorded yet: until the file is there the card is silent. */
const CLIP = "/audios/moduleAudios/order_matters.mp3";
const CARD = { width: 300, height: 372 };
/** Stage px down (the title ends at about 117). */
const CARD_TOP = 140;
const FLIP = { type: "spring", stiffness: 110, damping: 16 } as const;
const HIDDEN = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

/** A command, as a small chip. */
function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#E3F6F3] px-2.5 py-1 text-[11px] leading-4 font-semibold tracking-[0.2px] whitespace-nowrap text-[#04908F] dark:bg-[#0F2B28] dark:text-[#7FD8CC]">
      {children}
    </span>
  );
}

/**
 * "Tap to reveal": a card that turns over to why the order matters, with the
 * pick-up-then-place example. The explanation is read aloud on reveal; tapping
 * the card again (or Replay) reads it again. Continue unlocks once it is turned.
 */
export function RevealCardScreen() {
  const router = useRouter();
  const [muted] = useLevelMuted();
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const read = () => {
    // The clip is made on the first tap (a gesture the browser allows sound on), then replayed from the start.
    const audio = (audioRef.current ??= new Audio(CLIP));
    audio.muted = muted;
    audio.currentTime = 0;
    // A missing / blocked clip just stays silent.
    audio.play().catch(() => {});
  };

  const tap = () => {
    playClickSound();
    vibrateForTap();
    setRevealed(true);
    read();
  };

  return (
    <LevelTwoShell
      step={STEP.reveal}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(STEP.reveal))}
      scene={<SoftBackdrop />}
      ctaDisabled={!revealed}
      onContinue={() => router.push(sequenceNext(STEP.reveal))}
    >
      <ScreenTitle oneLine>
        Tap to <Teal>reveal</Teal>
      </ScreenTitle>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ opacity: { duration: 0.3 }, y: { type: "spring", stiffness: 140, damping: 16 } }}
        className="absolute inset-x-0 flex flex-col items-center gap-3"
        style={{ top: CARD_TOP }}
      >
        <div style={{ perspective: 1100, width: CARD.width, height: CARD.height }}>
          <motion.button
            type="button"
            onClick={tap}
            aria-label={revealed ? "Hear the explanation again" : "Tap to reveal the card"}
            initial={false}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={FLIP}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto relative block size-full cursor-pointer"
            style={{ transformStyle: "preserve-3d" }}
          >
            <span
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[24px] bg-[linear-gradient(160deg,#08A4AD_0%,#04ACAB_45%,#7FD8CC_100%)] px-6 text-white shadow-[0_8px_0_#067F86,0_14px_28px_rgba(8,164,173,0.3)]"
              style={HIDDEN}
            >
              <span className="flex size-[92px] items-center justify-center rounded-full bg-white/20">
                <Lightbulb aria-hidden className="size-[52px]" strokeWidth={1.6} />
              </span>
              <span className="text-[24px] leading-8 font-semibold">Why does order matter?</span>
              <span className="flex items-center gap-2 text-[15px] font-medium text-white/90">
                <Hand aria-hidden className="size-5" /> Tap to reveal
              </span>
            </span>
            <span
              className="absolute inset-0 flex flex-col justify-center gap-4 rounded-[24px] border-4 border-[#7FD8CC] bg-white px-5 py-6 text-left shadow-[0_8px_0_#BFE6E2,0_14px_28px_rgba(8,164,173,0.2)] dark:bg-[#15181E]"
              style={{ ...HIDDEN, transform: "rotateY(180deg)" }}
            >
              <span className="text-[13px] leading-4 font-semibold tracking-[0.6px] text-[#04ACAB] uppercase">Remember</span>
              <span className="text-[20px] leading-7 font-semibold text-[#444444] dark:text-white">
                The order matters because one instruction may need to happen before another.
              </span>
              <span className="flex flex-col gap-3 rounded-[16px] bg-[#F6F4FE] p-4 dark:bg-[#0F1F26]">
                <span className="flex items-center justify-center gap-2">
                  <Chip>PICK UP</Chip>
                  <ArrowRight aria-hidden className="size-4 text-[#04ACAB]" />
                  <Chip>PLACE IN TARGET</Chip>
                </span>
                <span className="text-[14px] leading-5 font-medium text-[#555555] dark:text-white/80">
                  We need to give the PICK UP command first. Only then can we give the PLACE IN TARGET command, otherwise it will not work properly.
                </span>
              </span>
            </span>
          </motion.button>
        </div>
        <motion.button
          type="button"
          onClick={tap}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -8 }}
          disabled={!revealed}
          className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-[#E7ECEF] bg-white px-4 py-2 text-[14px] leading-5 font-semibold text-[#08A4AD] shadow-[0_2px_10px_rgba(31,42,68,0.08)] enabled:active:scale-95 dark:border-white/10 dark:bg-[#15181E]"
        >
          <Volume2 aria-hidden className="size-[18px]" /> Replay
        </motion.button>
      </motion.div>
    </LevelTwoShell>
  );
}
