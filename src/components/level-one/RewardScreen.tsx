"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useRive } from "@rive-app/react-canvas";
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
/** What the hint under the chest says: first the ask, then (once the first tap is in) to go on. */
const HINT_FIRST = "Tap the box to open it!";
const HINT_KEEP_GOING = "Keep tapping!";

/**
 * "Open your reward!": the sunburst backdrop ("REWARD_BG") with the chest
 * ("REWARD_Chest") on it, both from `hex.riv`. The chest plays itself
 * (`Reward_SM`): it hears the taps on the box, no data is sent to it, and the
 * third tap opens it. The page only follows along (`onStateChange` says when the
 * machine moves to its next state) to word the hint and bring Continue in once
 * it is open. Until then a hint under the chest says to tap it.
 */
export function RewardScreen({ onContinue }: { onContinue: () => void }) {
  const { RiveComponent: Backdrop } = useRive({
    ...hexRiveSource(),
    artboard: background.artboard,
    stateMachines: background.stateMachine,
    autoplay: true,
    layout: BACKGROUND_LAYOUT,
  });
  const [ready, setReady] = useState(false);
  const [taps, setTaps] = useState(0);
  const [settled, setSettled] = useState(false);
  const open = taps >= chest.taps;
  // Rive keeps the callbacks it was created with, so the count lives in a ref.
  const tapsRef = useRef(0);
  const { RiveComponent: Chest } = useRive({
    ...hexRiveSource(),
    artboard: chest.artboard,
    stateMachine: chest.stateMachine,
    // Binds the artboard's own view model, which the machine needs to run.
    autoBind: true,
    autoplay: true,
    layout: CHEST_LAYOUT,
    onLoad: () => setReady(true),
    // Each tap on the box moves the machine into its next state: two taps, then the open one.
    onStateChange: (event) => {
      const states = Array.isArray(event.data) ? event.data : [];
      if (states.length === 0 || tapsRef.current >= chest.taps) return;
      tapsRef.current += 1;
      setTaps(tapsRef.current);
      if (tapsRef.current === chest.taps) vibrateForClaim();
      else vibrateForTap();
    },
  });

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setSettled(true), OPEN_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-[#0E93B0]">
      <div aria-hidden className="absolute inset-0">
        <Backdrop className="h-full w-full" />
      </div>
      {/* The chest hears the taps itself: only the box answers, not the empty artboard around it. */}
      <div
        role="img"
        aria-label={open ? "Reward chest, open" : `Reward chest: tap the box to open it (${taps} of ${chest.taps})`}
        className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
        style={{ width: CHEST_W, aspectRatio: CHEST_RATIO }}
      >
        <Chest className="h-full w-full" />
      </div>
      {/* Takes no taps itself: they go through to the chest under it. */}
      <AnimatePresence>
        {ready && !open && (
          <motion.p
            key="hint"
            className="pointer-events-none absolute inset-x-0 top-[70%] px-6 text-center text-[22px] leading-7 font-semibold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.25)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ opacity: { duration: 0.3 }, y: { duration: 0.3 }, scale: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } }}
          >
            {taps === 0 ? HINT_FIRST : HINT_KEEP_GOING}
          </motion.p>
        )}
      </AnimatePresence>
      {settled && (
        // Covers the screen: the animated wrapper is the box the button's `bottom` is measured from.
        <motion.div className="absolute inset-0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
          <SoloContinue onClick={onContinue} />
        </motion.div>
      )}
    </main>
  );
}
