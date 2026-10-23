"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { ChevronLeft, CircleHelp } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Button3D } from "@/components/ui/Button3D";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { HexBleed, HEX_BLEED } from "@/components/onboarding/robu/HexBleed";
import { REWARD_CHEST } from "@/lib/rive/runtime";
import { levelOneHref } from "./LevelOneShell";

/** The Figma frame this screen is laid out in. */
export const FRAME_W = 390;
export const FRAME_H = 844;
const MAX_SCALE = 1.5;

export const FLOAT_IN = { type: "spring", stiffness: 110, damping: 13 } as const;

export const useFrameScale = () => {
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => setScale(Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H, MAX_SCALE));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return scale;
};

/**
 * `/module?level=1&step=reward` — between screens 7 and 8 and not counted in
 * the 8: the "REWARD_Chest" Rive artboard: a tap fires its `open`
 * trigger, then a Claim button that goes on to screen 8.
 */
export function RewardScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const scale = useFrameScale();
  const [opened, setOpened] = useState(false);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white">
      {/* Scaled to cover the whole screen at its own aspect ratio (cropped, never stretched). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/reward-bg.png)" }}
      />
      <Chest onOpen={() => setOpened(true)} />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 origin-center"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? "hidden" : "visible",
        }}
      >
        <button
          type="button"
          onClick={() => {
            playClickSound();
            router.push(levelOneHref(7));
          }}
          aria-label="Back"
          className="absolute top-[51px] left-4 z-10 pointer-events-auto flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.4} />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="absolute top-[51px] left-[335px] z-10 pointer-events-auto flex h-[39px] w-[39px] cursor-pointer items-center justify-center rounded-md border border-black/8 text-[#444444] transition-transform active:scale-95"
        >
          <CircleHelp className="h-5 w-5" strokeWidth={1.6} />
        </button>

        {opened && <Claim onClaim={onContinue ?? (() => router.push(levelOneHref(8)))} />}
      </div>
    </main>
  );
}

const CHEST_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });
/** The chest's box: as wide as the screen less `CHEST_SIDE_PADDING` on each
 * side, square so the artboard keeps its aspect ratio, centred on the screen.
 * Never taller than half the screen, so on a wide desktop it isn't cropped. */
const CHEST_SIDE_PADDING = 16;
const CHEST_MAX_WIDTH = `min(calc(100vw - ${CHEST_SIDE_PADDING * 2}px), 50vh)`;

/** The closed chest ("REWARD_Chest" artboard): a tap fires its `open` trigger. */
function Chest({ onOpen }: { onOpen: () => void }) {
  const { RiveComponent, ready, fireTrigger } = useHexRive(
    CHEST_LAYOUT,
    REWARD_CHEST.stateMachine,
    REWARD_CHEST.artboard,
    REWARD_CHEST.viewModel,
    null,
    null,
    undefined,
    HEX_BLEED,
  );
  return (
    <button
      type="button"
      aria-label="Tap for reward"
      disabled={!ready}
      onClick={() => {
        playClickSound();
        fireTrigger(REWARD_CHEST.openTrigger);
        onOpen();
      }}
      className="absolute inset-0 z-[1] cursor-pointer outline-none"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: CHEST_MAX_WIDTH, maxWidth: CHEST_MAX_WIDTH, aspectRatio: "1 / 1" }}
      >
        <HexBleed Canvas={RiveComponent} />
      </span>
    </button>
  );
}

/** The Continue button, shown once the chest has opened. */
function Claim({ onClaim }: { onClaim: () => void }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FLOAT_IN, delay: 0.6 }}
    >
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-4 pb-9">
        <Button3D riveVariant="module" onClick={onClaim} onPress={playClickSound} className="w-full">
          Continue
        </Button3D>
      </div>
    </motion.div>
  );
}
