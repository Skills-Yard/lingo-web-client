"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRive } from "@rive-app/react-canvas";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { Volume2 } from "lucide-react";
import { useLevelMuted } from "@/components/level-one/levelMuted";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, Teal } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { applyArtboardBleed, artboardBleedBox } from "@/lib/rive/bleed";
import { configureRiveRuntime, FLIP_CARD } from "@/lib/rive/runtime";
import { SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";

configureRiveRuntime();

/** The explanation read aloud. It isn't recorded yet: until the file is there the card is silent. */
const CLIP = "/audios/moduleAudios/order_matters.mp3";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
/** Where the canvas sits in the card's box: past it by `FLIP_CARD.bleed` on every side. */
const BLEED_BOX = artboardBleedBox(FLIP_CARD, FLIP_CARD.bleed);
/** The card's height on the stage (frame px); its width follows the artboard's shape. */
const CARD_HEIGHT = 380;
/** Stage px down (the title ends at about 117). */
const CARD_TOP = 140;

/**
 * The "Flip card" artboard of `progressBar.riv`, set to its "Why does order
 * matter?" card. Both faces are drawn by the artboard; each tap fires its trigger,
 * which turns the card over (and back). It stays hidden, and takes no taps, until
 * the file has loaded and the card has been set.
 */
function OrderFlipCard({ onFlip }: { onFlip: () => void }) {
  // `crossOrigin: "anonymous"` matches the credentials mode of Rive's own `fetch()`,
  // or the browser ignores the preload and downloads the file a second time.
  preload(FLIP_CARD.src, { as: "fetch", crossOrigin: "anonymous" });

  const { rive, canvas, RiveComponent } = useRive({
    src: FLIP_CARD.src,
    artboard: FLIP_CARD.artboard,
    stateMachines: FLIP_CARD.stateMachine,
    autoplay: true,
    autoBind: true,
    layout: LAYOUT,
  });
  // Shown once loaded: it fades in from nothing, so the card is set before it can be seen.
  const ready = !!rive;

  // Its own card.
  useEffect(() => {
    const cardType = rive?.viewModelInstance?.number(FLIP_CARD.cardTypeProperty);
    if (cardType) cardType.value = FLIP_CARD.cardType.order;
  }, [rive]);

  // The canvas is bigger than the card by the bleed on every side, so the swell of
  // the turn isn't clipped at the artboard's edge.
  useEffect(() => {
    if (!rive || !canvas) return;
    return applyArtboardBleed(rive, canvas, FLIP_CARD, FLIP_CARD.bleed);
  }, [rive, canvas]);

  const flip = () => {
    if (!rive) return;
    rive.stateMachineInputs(FLIP_CARD.stateMachine)?.find((input) => input.name === FLIP_CARD.flipTrigger)?.fire();
    onFlip();
  };

  return (
    <motion.button
      type="button"
      onClick={flip}
      disabled={!ready}
      aria-label="Flip the card"
      initial={{ opacity: 0, y: 40 }}
      animate={ready ? { opacity: 1, y: 0 } : undefined}
      transition={{ opacity: { duration: 0.3 }, y: { type: "spring", stiffness: 140, damping: 16 } }}
      whileTap={{ scale: 0.98 }}
      className="pointer-events-auto relative shrink-0 cursor-pointer"
      style={{ height: CARD_HEIGHT, aspectRatio: `${FLIP_CARD.width} / ${FLIP_CARD.height}` }}
    >
      <RiveComponent aria-hidden style={{ position: "absolute", pointerEvents: "none", ...BLEED_BOX }} />
    </motion.button>
  );
}

/**
 * "Tap to reveal": the Rive flip card turns over to why the order matters, with
 * the pick-up-then-place example. The explanation is read aloud as it turns to
 * that side; Replay reads it again. Continue unlocks once it has been turned.
 */
export function RevealCardScreen() {
  const router = useRouter();
  const [muted] = useLevelMuted();
  const [revealed, setRevealed] = useState(false);
  // Which face is up: each tap turns it over.
  const [backUp, setBackUp] = useState(false);
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

  const onFlip = () => {
    playClickSound();
    vibrateForTap();
    setRevealed(true);
    const nowBackUp = !backUp;
    setBackUp(nowBackUp);
    if (nowBackUp) read();
    else audioRef.current?.pause();
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
      <div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ top: CARD_TOP }}>
        <OrderFlipCard onFlip={onFlip} />
        <motion.button
          type="button"
          onClick={() => {
            playClickSound();
            vibrateForTap();
            read();
          }}
          initial={false}
          animate={{ opacity: backUp ? 1 : 0, y: backUp ? 0 : -8 }}
          disabled={!backUp}
          className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-[#E7ECEF] bg-white px-4 py-2 text-[14px] leading-5 font-semibold text-[#08A4AD] shadow-[0_2px_10px_rgba(31,42,68,0.08)] enabled:active:scale-95 dark:border-white/10 dark:bg-[#15181E]"
        >
          <Volume2 aria-hidden className="size-[18px]" /> Replay
        </motion.button>
      </div>
    </LevelTwoShell>
  );
}
