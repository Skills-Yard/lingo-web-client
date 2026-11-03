"use client";

import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRive } from "@rive-app/react-canvas";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { playClickSound } from "@/components/onboarding/clickSound";
import { vibrateForTap } from "@/lib/haptics";
import { applyArtboardBleed, artboardBleedBox } from "@/lib/rive/bleed";
import { configureRiveRuntime, FLIP_CARD } from "@/lib/rive/runtime";
import { LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { levelTwoHref } from "./levelTwo";

configureRiveRuntime();

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
/** Where the canvas sits in the card's box: past it by `FLIP_CARD.bleed` on every side. */
const BLEED_BOX = artboardBleedBox(FLIP_CARD, FLIP_CARD.bleed);

/** Where the wall meets the floor in the picture, as a share of its height. */
const HORIZON = "67%";

/**
 * The empty room, already cropped to Figma's 390 x 844 frame. It covers the whole
 * stage, so it fills the screen whatever its shape. Where that cuts it (a stage
 * wider than the frame) it is held by the horizon, which stays at the same share of
 * the screen's height as in the frame.
 */
function RoomBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-no-repeat"
      style={{ backgroundImage: "url(/images/level-two/flipCard-bg.svg)", backgroundPosition: `50% ${HORIZON}` }}
    />
  );
}

/**
 * The "Flip card" artboard of `progressBar.riv`, at its own size in the middle of the
 * stage. Both faces are drawn by the artboard: each tap fires its trigger, which turns
 * the card over (and back). It stays hidden, and takes no taps, until the file has loaded.
 */
function FlipCard({ onFlip }: { onFlip: () => void }) {
  // `crossOrigin: "anonymous"` matches the credentials mode of Rive's own `fetch()`,
  // or the browser ignores the preload and downloads the file a second time.
  preload(FLIP_CARD.src, { as: "fetch", crossOrigin: "anonymous" });

  const { rive, canvas, RiveComponent } = useRive({
    src: FLIP_CARD.src,
    artboard: FLIP_CARD.artboard,
    stateMachines: FLIP_CARD.stateMachine,
    autoplay: true,
    layout: LAYOUT,
  });

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
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.button
        type="button"
        onClick={flip}
        disabled={!rive}
        aria-label="Flip the card"
        initial={{ opacity: 0, y: 40 }}
        animate={rive ? { opacity: 1, y: 0 } : undefined}
        transition={{ opacity: { duration: 0.3 }, y: { type: "spring", stiffness: 140, damping: 16 } }}
        whileTap={{ scale: 0.98 }}
        className="pointer-events-auto relative shrink-0 cursor-pointer"
        style={{ width: FLIP_CARD.width, height: FLIP_CARD.height }}
      >
        <RiveComponent aria-hidden style={{ position: "absolute", pointerEvents: "none", ...BLEED_BOX }} />
      </motion.button>
    </div>
  );
}

/**
 * `/module?step=10` — "Flip the card to reveal.": a card that turns over when tapped,
 * to what a command is. Next unlocks once it has been turned.
 */
export function FlipCardScreen() {
  const router = useRouter();
  const [seen, setSeen] = useState(false);

  const onFlip = () => {
    playClickSound();
    vibrateForTap();
    setSeen(true);
  };

  return (
    <LevelTwoShell
      step={10}
      scene={<RoomBackdrop />}
      ctaLabel="Next"
      ctaDisabled={!seen}
      onContinue={() => router.push(levelTwoHref(11))}
    >
      <ScreenTitle>
        Flip the card to <Teal>reveal.</Teal>
      </ScreenTitle>

      <FlipCard onFlip={onFlip} />
    </LevelTwoShell>
  );
}
