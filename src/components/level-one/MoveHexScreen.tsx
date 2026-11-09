"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { useSound } from "@/hooks/useSound";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { commandsHref } from "@/lib/routes";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { PlatformBattery } from "@/components/ui/PlatformBattery";
import { FeedbackPanel, OnboardingHex } from "./FeedbackPanel";
import { levelOneStep } from "./LevelOneShell";
import { useLevelMuted } from "./levelMuted";
import { useBatteryClaim } from "./useBatteryClaim";

/** Its place in the module. */
const STEP = 16;

/** How long Hex's walk to the next tile takes before the move's result shows. */
const STEP_MS = 400;

/** The intro game's platform (350 x 295), centred where the guide platform was; its height follows the picture's shape. */
const PLATFORM = { top: 205, width: 340, height: 287 };
/** The middle column's tiles: how far down the platform each one's centre is (px). */
const TILE_Y = {
  top: PLATFORM.height * 0.22,
  centre: PLATFORM.height * 0.43,
  bottom: PLATFORM.height * 0.66,
} as const;
type Tile = keyof typeof TILE_Y;

/** Hex's box, centred on his tile; his artboard has room around him. */
const HEX_BOX = 100;
/** How far above the tile's centre Hex's box sits, so he stands on the tile. */
const HEX_LIFT = 10;
/** The battery's box, standing on the top-middle tile: the artboard (268 x 150) drawn `drawn` wide, lying flat. */
const BATTERY = { drawn: 48, width: 48, height: 27, lift: 10 };
/** `battery.riv`, small and lying flat on its tile. */
function GuideBattery() {
  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{ width: BATTERY.drawn, height: (BATTERY.drawn * 150) / 268, translate: "-50% -50%" }}
    >
      <PlatformBattery />
    </div>
  );
}

const BUTTONS_TOP = 508;
/**
 * The game played as part of another module: the board opens on a tip with Hex
 * on the top tile, "Let's Try" sets the battery there and brings him to the middle,
 * and the result is a panel reported through `onAnswer`; Continue then opens the gem
 * popup and, once the battery is claimed, goes on through `onDone`.
 */
export type MoveHexFlow = {
  step: number;
  total: number;
  /** Read when the screen opens, in place of the first lesson's. */
  voiceover?: readonly string[];
  onBack: () => void;
  tip: ReactNode;
  rightTitle: string;
  right: string;
  wrongTitle: string;
  wrong: string;
  /** Each result, right or wrong. */
  onAnswer: (correct: boolean) => void;
  onDone: () => void;
};

const WRONG_WAY = "Oops, that’s the wrong way! The battery is straight ahead. Tap anywhere on this panel to try again.";

/** Like the robot screens' picture: it starts under the top bar (52px) and the gap below it (8px). It stays clear for 35px then fades in over 185px, and fades out again from 330px to 448px (stage 508, where the buttons start), instead of ending in a hard line. */
const TOP_BAR_CLEARANCE = 60;
const EDGE_MASK = "linear-gradient(180deg, transparent 35px, #000 220px, #000 330px, transparent 448px)";

/** The meadow picture fills the stage under the top bar, cut at the sides or bottom where its shape differs. */
export function MeadowBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 bg-[#F1F8C8] bg-cover bg-top bg-no-repeat"
      style={{ top: TOP_BAR_CLEARANCE, backgroundImage: "url(/images/level-one/guide-hex-meadow.png)", maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
    />
  );
}

/** The arrow of a move button, pointing up (Figma's 29 x 46 vector). */
export function MoveArrow({ id, from, to, stroke, flipped = false }: { id: string; from: string; to: string; stroke: string; flipped?: boolean }) {
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
export function MoveButton({ label, look, disabled, onPress, children }: { label: string; look: string; disabled: boolean; onPress: () => void; children: React.ReactNode }) {
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
 * `/module/commands?step=16` — "Let's guide Hex": Hex stands on the middle of a 3 x 3
 * platform with the battery one tile ahead, and each button walks him a tile at
 * once. Go Straight reaches the battery, which opens the gem popup and unlocks
 * Continue; Go Back misses it, which offers Try again.
 */
export function MoveHexScreen({ flow }: { flow?: MoveHexFlow } = {}) {
  const router = useRouter();
  const [muted] = useLevelMuted();
  const triggerSound = useSound(!muted);
  // With a flow it opens on its tip; "Let's Try" starts the game.
  const [intro, setIntro] = useState(!!flow);
  const [tile, setTile] = useState<Tile>(flow ? "top" : "centre");
  const [result, setResult] = useState<"solved" | "failed" | null>(null);
  // The gem popup opens once, the moment Hex reaches the battery; closing it
  // (or its 3 second countdown running out) claims the battery and plays the
  // Battery Doctor, and leaves Continue to go on. In a flow the popup comes
  // after the result panel, and the end of the Doctor moves on.
  const { win, popup } = useBatteryClaim(flow?.onDone);
  // A miss counts against this question: the first go is what is noted, and
  // Continue asks to be shown it again unless the first go made it.
  const missed = useRef(false);

  useEffect(() => {
    if (tile === "centre" || intro) return;
    const timer = window.setTimeout(() => {
      if (tile === "top") {
        triggerSound("win");
        setResult("solved");
        if (flow) flow.onAnswer(true);
        else win();
        return;
      }
      triggerSound("lose");
      setResult("failed");
      flow?.onAnswer(false);
      if (missed.current) return;
      missed.current = true;
      if (!flow) noteAnswer(STEP, false);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [tile, intro, flow, triggerSound, win]);

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
      step={flow?.step ?? levelOneStep(8)}
      total={flow?.total}
      onBack={flow?.onBack}
      voiceover={flow?.voiceover ?? MODULE_AUDIO.guideHex}
      scene={<MeadowBackdrop />}
      ctaLabel={failed ? "Try again" : flow && !solved ? "Let’s Try" : "Continue"}
      ctaDisabled={!intro && !solved && !failed}
      // The wrong-result panel sits below the Continue row, like on the quizzes;
      // a tap on it takes Hex back to try again. The gem popup is above all.
      overlay={
        <>
          <div className="absolute inset-0 z-[9]" style={{ pointerEvents: failed ? "auto" : "none" }} onClick={tryAgain}>
            <FeedbackPanel correct={false} title={flow?.wrongTitle} open={failed} hexIn={failed} centred={!!flow} grouped={!flow}>
              {flow?.wrong ?? WRONG_WAY}
            </FeedbackPanel>
          </div>
          {flow && (
            <div className="pointer-events-none absolute inset-0">
              <FeedbackPanel correct title={flow.rightTitle} open={solved} hexIn={solved} hexCue={HEX_ONBOARDING_TRIGGER.continueThumb} centred>
                {flow.right}
              </FeedbackPanel>
            </div>
          )}
          {popup}
        </>
      }
      onContinue={() => {
        if (intro) {
          setIntro(false);
          setTile("centre");
          return;
        }
        if (failed) {
          tryAgain();
          return;
        }
        if (flow) {
          win();
          return;
        }
        noteAnswer(STEP, !missed.current);
        router.push(nextAfter(STEP, !missed.current, commandsHref("complete")));
      }}
    >
      <ScreenTitle oneLine>
        Let’s <Teal>guide</Teal> Hex
      </ScreenTitle>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: stageTop(PLATFORM.top), width: PLATFORM.width, height: PLATFORM.height }}
      >
        <Image src="/images/platformlayers/3layer-platform.webp" alt="" fill sizes="534px" priority className="object-contain" />

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
          animate={solved || intro ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(255,226,70,0.85)_0%,rgba(255,226,70,0)_70%)]" />
          <GuideBattery />
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

      {intro ? (
        <div className="absolute left-1/2 w-[340px] -translate-x-1/2" style={{ top: stageTop(BUTTONS_TOP) }}>
          {flow?.tip}
        </div>
      ) : (
      <div className="absolute left-1/2 flex w-[319px] -translate-x-1/2 gap-[18px]" style={{ top: stageTop(BUTTONS_TOP) }}>
        <MoveButton label="Go Straight" look="bg-[#EDFAFE] shadow-[0_4px_0_#BFE6F2]" disabled={tile !== "centre"} onPress={() => walk("top")}>
          <MoveArrow id="guide-hex-straight" from="#74EBF7" to="#0F88E5" stroke="#1F4899" />
        </MoveButton>
        <MoveButton label="Go Back" look="bg-[#FEF8EC] shadow-[0_4px_0_#F2DFB8]" disabled={tile !== "centre"} onPress={() => walk("bottom")}>
          <MoveArrow id="guide-hex-back" from="#FA8728" to="#FEEAA2" stroke="#CD5B25" flipped />
        </MoveButton>
      </div>
      )}
    </LevelTwoShell>
  );
}
