"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { Confetti } from "./Confetti";
import { FeedbackPanel, OnboardingHex, XpBurst } from "./FeedbackPanel";
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

/** This screen's own results (a flow brings its own): Go Straight reaches the battery, Go Back walks away from it. */
const RIGHT_WAY = (
  <>
    Yes! Hex followed <b>Go Straight</b> and reached the battery.
  </>
);
const WRONG_WAY = "Go Back took Hex away from the battery. It is straight ahead!";

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

/** The four moves on the game screen, two across (Figma "Frame 82"): the box's tint and the arrow's picture (`public/animations/svg/game-path`). */
export const MOVES = [
  { id: "straight", label: "Go Straight", icon: "arrow-up.svg", look: "bg-[#EDFAFE] dark:bg-[#15233A]" },
  { id: "back", label: "Go Back", icon: "arrow-down.svg", look: "bg-[#FEF8EC] dark:bg-[#2A2218]" },
  { id: "left", label: "Turn Left", icon: "arrow-left.svg", look: "bg-[#F6F4FE] dark:bg-[#1E1A3A]" },
  { id: "right", label: "Turn Right", icon: "arrow-right.svg", look: "bg-[#FFF4F6] dark:bg-[#33202A]" },
] as const;
export type MoveId = (typeof MOVES)[number]["id"];

/** What a turn says: Hex only turns on his tile, so the battery is still ahead. */
const WRONG_TURN = "A turn only spins Hex on his tile. The battery is straight ahead!";

/**
 * A move button on the game screens: a flat 150.5 x 99 box (12px padding, 2px gap), the 52px arrow over its label (500, 14px / 140%); it presses in a little when tapped.
 * With `dim` it fades while it is disabled (a list that is full, a run in progress); without, it keeps its look.
 */
export function MoveTile({ label, icon, look, disabled, dim = false, onPress }: { label: string; icon: string; look: string; disabled: boolean; dim?: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`pointer-events-auto flex h-[99px] w-[150.5px] flex-col items-center justify-center gap-0.5 rounded-lg p-3 text-[14px] leading-[140%] font-medium text-[#444444] transition-[transform,opacity] duration-100 enabled:cursor-pointer enabled:active:scale-[0.97] dark:text-white ${dim ? "disabled:opacity-50" : ""} ${look}`}
    >
      <Image src={`/animations/svg/game-path/${icon}`} alt="" width={52} height={52} unoptimized className="size-[52px] shrink-0" />
      {label}
    </button>
  );
}

/**
 * `/module/commands?step=16` — "Let's guide Hex": Hex stands on the middle of a 3 x 3
 * platform with the battery one tile ahead, and each button acts at once. Go
 * Straight reaches the battery, which opens the gem popup and unlocks Continue;
 * Go Back walks him away from it, and a turn only spins him on his tile: both
 * miss, which offers Try again.
 */
export function MoveHexScreen({ flow }: { flow?: MoveHexFlow } = {}) {
  const router = useRouter();
  const [muted] = useLevelMuted();
  const triggerSound = useSound(!muted);
  // With a flow it opens on its tip; "Let's Try" starts the game.
  const [intro, setIntro] = useState(!!flow);
  const [tile, setTile] = useState<Tile>(flow ? "top" : "centre");
  // A turn was pressed: Hex stays on his tile, and it is a miss.
  const [turned, setTurned] = useState(false);
  const [result, setResult] = useState<"solved" | "failed" | null>(null);
  // Outside a flow the right result waits for the gem popup, the claim and the
  // Battery Doctor to finish, then its panel comes up by itself.
  const [claimed, setClaimed] = useState(false);
  // The progress bar's reaction, as for a checked quiz answer (not in a flow, whose screens note their own).
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const report = useCallback((correct: boolean) => setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct })), []);
  // The gem popup opens once, the moment Hex reaches the battery; closing it
  // (or its 3 second countdown running out) claims the battery and plays the
  // Battery Doctor, and the end of that brings up the right result and leaves
  // Continue to go on. In a flow the popup comes after the result panel, and
  // the end of the Doctor moves on.
  const afterClaim = useCallback(() => {
    if (flow) {
      flow.onDone();
      return;
    }
    setClaimed(true);
    report(true);
  }, [flow, report]);
  const { win, popup } = useBatteryClaim(afterClaim);
  // A miss counts against this question: the first go is what is noted, and
  // Continue asks to be shown it again unless the first go made it.
  const missed = useRef(false);

  useEffect(() => {
    if ((tile === "centre" && !turned) || intro) return;
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
      if (!flow) report(false);
      if (missed.current) return;
      missed.current = true;
      if (!flow) noteAnswer(STEP, false);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [tile, turned, intro, flow, triggerSound, win, report]);

  const press = (move: MoveId) => {
    triggerSound("step");
    if (move === "straight") setTile("top");
    else if (move === "back") setTile("bottom");
    else setTurned(true);
  };
  const tryAgain = () => {
    setResult(null);
    setTile("centre");
    setTurned(false);
  };

  const solved = result === "solved";
  const failed = result === "failed";
  // The right panel: at once in a flow, after the claim's effects otherwise.
  const rightOpen = flow ? solved : claimed;

  return (
    <LevelTwoShell
      step={flow?.step ?? levelOneStep(8)}
      total={flow?.total}
      onBack={flow?.onBack}
      voiceover={flow?.voiceover ?? MODULE_AUDIO.guideHex}
      scene={<MeadowBackdrop />}
      ctaLabel={failed ? "Try again" : flow && !solved ? "Let’s Try" : "Continue"}
      // Outside a flow Continue waits for the right panel, so it can't be pressed under the gem popup.
      ctaDisabled={!intro && !rightOpen && !failed}
      answer={answer}
      // The result panels sit below the Continue row, like on the quizzes;
      // a tap on the wrong one takes Hex back to try again. The gem popup is above all.
      overlay={
        <>
          <div className="absolute inset-0 z-[9]" style={{ pointerEvents: failed ? "auto" : "none" }} onClick={tryAgain}>
            <FeedbackPanel correct={false} title={flow?.wrongTitle} open={failed} hexIn={failed} centred={!!flow} grouped={!flow}>
              {flow?.wrong ?? (turned ? WRONG_TURN : WRONG_WAY)}
            </FeedbackPanel>
          </div>
          <div className="pointer-events-none absolute inset-0">
            <FeedbackPanel correct title={flow?.rightTitle} open={rightOpen} hexIn={rightOpen} hexCue={HEX_ONBOARDING_TRIGGER.continueThumb} centred={!!flow} grouped={!flow}>
              {flow?.right ?? RIGHT_WAY}
            </FeedbackPanel>
          </div>
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
      <Confetti active={claimed} />
      <XpBurst show={claimed} />

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
      <div className="absolute left-1/2 grid w-[319px] -translate-x-1/2 grid-cols-2 gap-[18px]" style={{ top: stageTop(BUTTONS_TOP) }}>
        {MOVES.map((move) => (
          <MoveTile key={move.id} label={move.label} icon={move.icon} look={move.look} disabled={tile !== "centre" || turned} onPress={() => press(move.id)} />
        ))}
      </div>
      )}
    </LevelTwoShell>
  );
}
