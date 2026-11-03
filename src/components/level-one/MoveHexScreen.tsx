"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { useSound } from "@/hooks/useSound";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
import { moduleHref } from "@/lib/routes";
import { FeedbackPanel, OnboardingHex } from "./FeedbackPanel";
import { GemPopup } from "./GemPopup";
import { levelOneStep } from "./LevelOneShell";
import { useLevelMuted } from "./levelMuted";

/** Its place in the module. */
const STEP = 16;

/** How long Hex's walk to the next tile takes before the move's result shows. */
const STEP_MS = 400;

/** The platform on Figma's frame; its height follows the picture's shape (1000 x 747). */
const PLATFORM = { top: 216, width: 356, height: 266 };
/** The middle column's tiles: how far down the platform each one's centre is (px). */
const TILE_Y = {
  top: PLATFORM.height * 0.183,
  centre: PLATFORM.height * 0.475,
  bottom: PLATFORM.height * 0.766,
} as const;
type Tile = keyof typeof TILE_Y;

/** Hex's box, centred on his tile; his artboard has room around him. */
const HEX_BOX = 100;
/** How far above the tile's centre Hex's box sits, so he stands on the tile. */
const HEX_LIFT = 10;
/** The battery's box (the picture is 145 x 132), standing on the top-middle tile. */
const BATTERY = { width: 66, height: 60, lift: 16 };

const BUTTONS_TOP = 508;
const WRONG_WAY = "Oops, that’s the wrong way! The battery is straight ahead. Tap anywhere on this panel to try again.";

/**
 * The picture is wider than the screen, so it is kept tall enough for its horizon
 * to sit where Figma's does and is cut at the sides; a white wash pales it, down to
 * plain white where the buttons start.
 */
function MeadowBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-white">
      <div
        className="absolute top-0 left-1/2 aspect-[3/2] w-[max(100%,803px)] -translate-x-1/2 bg-cover"
        style={{ backgroundImage: "url(/images/level-one/guide-hex-bg.webp)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.6)_55%,#ffffff_100%)]" />
      </div>
    </div>
  );
}

/** The arrow of a move button, pointing up (Figma's 29 x 46 vector). */
function MoveArrow({ id, from, to, stroke, flipped = false }: { id: string; from: string; to: string; stroke: string; flipped?: boolean }) {
  return (
    <svg aria-hidden width={29} height={46} viewBox="0 0 29 46" className={flipped ? "-scale-y-100" : undefined}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M14.5 1 28 20h-8v25H9V20H1z" fill={`url(#${id})`} stroke={stroke} strokeLinejoin="round" />
    </svg>
  );
}

/** A 3D move button: its face stands 4px up on a darker edge, and sinks onto it when pressed. */
function MoveButton({ label, look, disabled, onPress, children }: { label: string; look: string; disabled: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`pointer-events-auto flex h-[99px] w-[150.5px] flex-col items-center justify-center gap-0.5 rounded-lg p-3 text-[14px] leading-[140%] font-medium text-[#444444] transition-[translate,box-shadow] duration-100 enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-none ${look}`}
    >
      <span className="flex h-12 w-12 items-center justify-center">{children}</span>
      {label}
    </button>
  );
}

/**
 * `/module?step=16` — "Let's guide Hex": Hex stands on the middle of a 3 x 3
 * platform with the battery one tile ahead, and each button walks him a tile at
 * once. Go Straight reaches the battery, which opens the gem popup and unlocks
 * Continue; Go Back misses it, which offers Try again.
 */
export function MoveHexScreen() {
  const router = useRouter();
  const [muted] = useLevelMuted();
  const triggerSound = useSound(!muted);
  const [tile, setTile] = useState<Tile>("centre");
  const [result, setResult] = useState<"solved" | "failed" | null>(null);
  // The gem popup opens once, the moment Hex reaches the battery; closing it
  // (or its 3 second countdown running out) leaves Continue to go on.
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => setGemOpen(false), []);
  // A miss counts against this question: the first go is what is noted, and
  // Continue asks to be shown it again unless the first go made it.
  const missed = useRef(false);

  useEffect(() => {
    if (tile === "centre") return;
    const timer = window.setTimeout(() => {
      if (tile === "top") {
        triggerSound("win");
        setResult("solved");
        setGemOpen(true);
        return;
      }
      triggerSound("lose");
      setResult("failed");
      if (missed.current) return;
      missed.current = true;
      noteAnswer(STEP, false);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [tile, triggerSound]);

  const walk = (to: Tile) => {
    triggerSound("step");
    setTile(to);
  };
  const tryAgain = () => {
    setResult(null);
    setTile("centre");
  };

  const solved = result === "solved";
  const failed = result === "failed";

  return (
    <LevelTwoShell
      step={levelOneStep(8)}
      scene={<MeadowBackdrop />}
      ctaLabel={failed ? "Try again" : "Continue"}
      ctaDisabled={!solved && !failed}
      // The wrong-result panel sits below the Continue row, like on the quizzes;
      // a tap on it takes Hex back to try again. The gem popup is above all.
      overlay={
        <>
          <div className="absolute inset-0 z-[9]" style={{ pointerEvents: failed ? "auto" : "none" }} onClick={tryAgain}>
            <FeedbackPanel correct={false} open={failed} hexIn={failed}>
              {WRONG_WAY}
            </FeedbackPanel>
          </div>
          <GemPopup open={gemOpen} onClose={closeGem} />
        </>
      }
      onContinue={() => {
        if (failed) {
          tryAgain();
          return;
        }
        noteAnswer(STEP, !missed.current);
        router.push(nextAfter(STEP, !missed.current, moduleHref("complete")));
      }}
    >
      <ScreenTitle oneLine>
        Let’s <Teal>guide</Teal> Hex
      </ScreenTitle>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: stageTop(PLATFORM.top), width: PLATFORM.width, height: PLATFORM.height }}
      >
        <Image src="/images/level-one/guide-hex-platform.webp" alt="" fill sizes="534px" priority />

        <motion.div
          aria-hidden
          className="absolute left-1/2"
          style={{
            top: TILE_Y.top - BATTERY.height / 2 - BATTERY.lift,
            width: BATTERY.width,
            height: BATTERY.height,
            marginLeft: -BATTERY.width / 2,
          }}
          initial={false}
          animate={solved ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(255,226,70,0.85)_0%,rgba(255,226,70,0)_70%)]" />
          <Image src="/images/battery-icon.png" alt="" fill sizes="114px" className="object-contain" />
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute top-0 left-1/2"
          style={{ width: HEX_BOX, height: HEX_BOX, marginLeft: -HEX_BOX / 2 }}
          initial={false}
          animate={{ y: TILE_Y[tile] - HEX_BOX / 2 - HEX_LIFT }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <OnboardingHex entryKey="guide-hex" />
        </motion.div>
      </div>

      <div className="absolute left-1/2 flex w-[319px] -translate-x-1/2 gap-[18px]" style={{ top: stageTop(BUTTONS_TOP) }}>
        <MoveButton label="Go Straight" look="bg-[#EDFAFE] shadow-[0_4px_0_#BFE6F2]" disabled={tile !== "centre"} onPress={() => walk("top")}>
          <MoveArrow id="guide-hex-straight" from="#74EBF7" to="#0F88E5" stroke="#1F4899" />
        </MoveButton>
        <MoveButton label="Go Back" look="bg-[#FEF8EC] shadow-[0_4px_0_#F2DFB8]" disabled={tile !== "centre"} onPress={() => walk("bottom")}>
          <MoveArrow id="guide-hex-back" from="#FA8728" to="#FEEAA2" stroke="#CD5B25" flipped />
        </MoveButton>
      </div>
    </LevelTwoShell>
  );
}
