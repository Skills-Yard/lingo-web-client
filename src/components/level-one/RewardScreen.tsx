"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { vibrateForClaim, vibrateForTap } from "@/lib/haptics";
import { hexRiveSource } from "@/lib/rive/hexFile";
import { configureRiveRuntime, REWARD_SCREEN } from "@/lib/rive/runtime";
import { SoloContinue } from "./SoloContinue";

configureRiveRuntime();

const { background, chest } = REWARD_SCREEN;

/** The backdrop fills the screen, whatever its shape (it is a sunburst: nothing in it is cut off). */
const BACKGROUND_LAYOUT = new Layout({ fit: Fit.Cover, alignment: Alignment.Center });
const CHEST_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/**
 * The chest's artboard is 440 x 430 with the box in its middle: it is drawn wider
 * than a phone (its empty margins are clipped by the screen) so the box is big,
 * and held to a size on a wide screen.
 */
const CHEST_W = "min(150vw, 640px)";
const CHEST_RATIO = "440 / 430";
/** How long the lid takes to open and settle (ms) before Continue comes in. */
const OPEN_SETTLE_MS = 1900;

/**
 * "Open your reward!": the sunburst backdrop ("REWARD_BG") with the chest
 * ("REWARD_Chest") on it, both from `hex.riv`. Each tap anywhere on the screen
 * (mouse, touch or keyboard) sets the chest's `tap` to the next of 1, 2, 3 (so
 * each plays its own animation), and the third opens it. Only then does Continue
 * come in; there is nothing else on the screen.
 */
export function RewardScreen({ onContinue }: { onContinue: () => void }) {
  const { RiveComponent: Backdrop } = useRive({
    ...hexRiveSource(),
    artboard: background.artboard,
    stateMachines: background.stateMachine,
    autoplay: true,
    layout: BACKGROUND_LAYOUT,
  });
  const { RiveComponent: Chest, ready, setNumber } = useHexRive(CHEST_LAYOUT, chest.stateMachine, chest.artboard, chest.viewModel);
  const [taps, setTaps] = useState(0);
  const [settled, setSettled] = useState(false);
  const open = taps >= chest.taps;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setSettled(true), OPEN_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const tap = () => {
    if (!ready || open) return;
    const next = taps + 1;
    setNumber(chest.tapProperty, next);
    setTaps(next);
    if (next === chest.taps) vibrateForClaim();
    else vibrateForTap();
  };

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-[#0E93B0]">
      <div aria-hidden className="absolute inset-0">
        <Backdrop className="h-full w-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: CHEST_W, aspectRatio: CHEST_RATIO }}>
        <Chest className="h-full w-full" />
      </div>
      {/* A tap anywhere on the screen counts (mouse, touch or keyboard): the button covers it all, over the chest. */}
      <button
        type="button"
        aria-label={open ? "Reward chest, open" : `Tap to open the reward chest (${taps} of ${chest.taps})`}
        disabled={!ready || open}
        onClick={tap}
        className="absolute inset-0 cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:outline-none focus-visible:ring-inset disabled:cursor-default"
      />
      {settled && (
        // Covers the screen: the animated wrapper is the box the button's `bottom` is measured from.
        <motion.div className="absolute inset-0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
          <SoloContinue onClick={onContinue} />
        </motion.div>
      )}
    </main>
  );
}
