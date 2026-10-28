"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Hand, Scan, type LucideIcon } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { ActionRow } from "@/components/level-one/ActionRow";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { LevelOneShell } from "@/components/level-one/LevelOneShell";
import { vibrateForTap } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { moduleHref } from "@/lib/routes";

/** Screens in Module 2 (the progress bar's total). */
export const LEVEL_TWO_STEPS = 3;

const levelTwoHref = (step: number | "complete") => moduleHref(2, step);

/** The robot-arm picture (the arm, its table and the target box; the cube is
 * drawn over it so it can move) and its size in px. */
const SCENE_SRC = "/images/level-two/robot-arm-bg.webp";
const SCENE_W = 1560;
const SCENE_H = 2383;
/** The picture's sky and floor colours, carried on above and below it. */
const SKY = "#D5E9FB";
const FLOOR = "#EAE4E0";
/** The picture's bottom edge sits this far (frame px) above the screen's,
 * so the table clears the button and the result card. */
const SCENE_LIFT = 70;
/** On a wide screen the picture keeps a phone's width. */
const SCENE_MAX_W = 450;

/** Picture px -> % of the picture. */
const px = (x: number, y: number) => ({ left: `${(x / SCENE_W) * 100}%`, top: `${(y / SCENE_H) * 100}%` });

/** The cube's top-left corner in each of its spots (picture px). */
const CUBE_AT = {
  table: px(448, 1643),
  held: px(507, 1407),
  overTarget: px(994, 1407),
  target: px(994, 1587),
} as const;
const CUBE_SIZE = { width: `${(240 / SCENE_W) * 100}%`, height: `${(222 / SCENE_H) * 100}%` };

type CubeSpot = keyof typeof CUBE_AT;

type Round = {
  /** What Hex says. */
  line: string;
  command: { label: string; icon: LucideIcon; iconClass: string };
  /** Where the cube is at the start, and the spots it moves through once the
   * command is given (the last is where it stays). */
  from: CubeSpot;
  moves: readonly CubeSpot[];
  /** The result card's sentence. */
  result: string;
};

const ROUNDS: readonly Round[] = [
  {
    line: "The robot can pick up objects. Let's give it the instruction.",
    command: { label: "Pick Up", icon: Box, iconClass: "fill-[#1F6BFF] text-[#0B4FD6]" },
    from: "table",
    moves: ["held"],
    result: "You gave an instruction. The robot picked up the cube.",
  },
  {
    line: "The robot is holding the cube. Which instruction will make it release the cube right?",
    command: { label: "Put Down", icon: Hand, iconClass: "fill-[#FFC79A] text-[#F08A3E]" },
    from: "held",
    moves: ["table"],
    result: "You gave a different instruction. The robot put the cube down on the table.",
  },
  {
    line: "Let's move the cube to target area. Which instruction will do this?",
    command: { label: "Place in Target", icon: Scan, iconClass: "text-[#04ACAB]" },
    from: "table",
    moves: ["held", "overTarget", "target"],
    result: "You gave an instruction with a destination. The robot moved the cube to the target area and placed it there.",
  },
];

/** Each leg of the cube's trip. */
const LEG_S = 0.55;
/** The result card follows once the cube has settled. */
const RESULT_AFTER_S = 0.25;

/**
 * `/module?level=2&step=1…3` — "Your turn to give an instruction!": Hex asks
 * for a command, the learner gives it (the one button), the robot arm's cube
 * does it, and a card says what the instruction did before Continue.
 */
export function CommandScreen({ round }: { round: number }) {
  const router = useRouter();
  const { line, command, from, moves, result } = ROUNDS[round - 1];
  // Given: the cube is on its way. Done: it has arrived and the card is up.
  const [given, setGiven] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!given) return;
    const timer = window.setTimeout(() => setDone(true), (moves.length * LEG_S + RESULT_AFTER_S) * 1000);
    return () => window.clearTimeout(timer);
  }, [given, moves.length]);

  const next = () => router.push(round < LEVEL_TWO_STEPS ? levelTwoHref(round + 1) : levelTwoHref("complete"));

  return (
    <LevelOneShell
      step={round}
      total={LEVEL_TWO_STEPS}
      onBack={() => router.push(round > 1 ? levelTwoHref(round - 1) : "/level")}
      action={
        <div className="relative z-10 w-full shrink-0">
          <AnimatePresence>
            {done && <ResultCard key="result">{result}</ResultCard>}
          </AnimatePresence>
          {done ? (
            <ActionRow maxWidth={450} ctaLabel="Continue" onContinue={next} />
          ) : (
            <CommandButton
              label={command.label}
              Icon={command.icon}
              iconClass={command.iconClass}
              disabled={given}
              onPress={() => {
                playClickSound();
                vibrateForTap();
                setGiven(true);
              }}
            />
          )}
        </div>
      }
    >
      <Scene from={from} moves={moves} go={given} />

      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.15 }}
        className="mt-4 w-full text-[26px] leading-[34px] font-semibold text-[#1F2A44]"
      >
        Your turn to give an
        <br />
        <span className="text-level-gradient">instruction!</span>
      </motion.h1>

      <div className="mt-4 flex w-full items-center gap-2">
        <div aria-hidden className="relative h-[92px] w-[92px] shrink-0">
          <OnboardingHex entryKey={`command-${round}`} cue={done ? HEX_ONBOARDING_TRIGGER.continueThumb : null} />
        </div>
        <SpeechBubble key={round}>{line}</SpeechBubble>
      </div>
    </LevelOneShell>
  );
}

/** Hex's line, in a bubble whose tail points back at him. */
function SpeechBubble({ children }: { children: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      style={{ transformOrigin: "0% 50%" }}
      className="relative min-w-0 flex-1 rounded-xl border-[1.5px] border-[#04ACAB] bg-white px-3 py-2.5 shadow-[0_4px_12px_rgba(4,172,171,0.12)]"
    >
      <span
        aria-hidden
        className="absolute top-1/2 -left-[7px] h-3 w-3 -translate-y-1/2 rotate-45 border-b-[1.5px] border-l-[1.5px] border-[#04ACAB] bg-white"
      />
      <p className="relative text-[13px] leading-[18px] font-medium text-[#2C2C2C]">{children}</p>
    </motion.div>
  );
}

/**
 * The robot arm over its table, behind everything on the screen: pinned to
 * the bottom of the stage (lifted clear of the button), with the sky carried
 * on above it and the floor below. The cube is drawn on top of the picture,
 * at `from`, and with `go` travels through `moves`.
 */
function Scene({ from, moves, go }: { from: CubeSpot; moves: readonly CubeSpot[]; go: boolean }) {
  const spots = [from, ...moves];
  const end = moves[moves.length - 1];
  const keyframes = (axis: "left" | "top") => spots.map((spot) => CUBE_AT[spot][axis]);
  // The shadow sits under where the cube ends up: dark on the table, faint
  // while the arm holds it up.
  const shadowAt = go ? end : from;
  const resting = shadowAt === "table" || shadowAt === "target";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ backgroundColor: FLOOR }}>
      <div className="absolute inset-x-0 top-0" style={{ bottom: SCENE_LIFT, backgroundColor: SKY }} />
      <div
        className="absolute left-1/2 w-full -translate-x-1/2"
        style={{ bottom: SCENE_LIFT, maxWidth: SCENE_MAX_W, aspectRatio: `${SCENE_W} / ${SCENE_H}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCENE_SRC} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
        {/* The picture's top edge fades into the sky above it. */}
        <div className="absolute inset-x-0 top-0 h-[12%]" style={{ background: `linear-gradient(${SKY}, transparent)` }} />

        {/* The cube's shadow on the table. */}
        <motion.div
          className="absolute h-[2.2%] w-[17%] rounded-[50%] bg-[#1F2A44]/25 blur-[3px]"
          initial={false}
          animate={{
            left: `calc(${CUBE_AT[shadowAt].left} - 0.8%)`,
            top: shadowAt === "target" ? "74.4%" : "76.9%",
            opacity: resting ? 1 : 0.35,
            scale: resting ? 1 : 0.7,
          }}
          transition={go ? { duration: LEG_S, delay: (moves.length - 1) * LEG_S } : { duration: 0 }}
        />

        <motion.img
          src="/images/level-two/cube.png"
          alt=""
          draggable={false}
          className="absolute select-none"
          style={CUBE_SIZE}
          initial={false}
          animate={
            go
              ? { left: keyframes("left"), top: keyframes("top"), rotate: spots.map((_, i) => (i === 0 || i === spots.length - 1 ? 0 : -3)) }
              : { left: CUBE_AT[from].left, top: CUBE_AT[from].top, rotate: 0 }
          }
          transition={
            go
              ? { duration: moves.length * LEG_S, ease: "easeInOut", times: spots.map((_, i) => i / moves.length) }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  );
}

/** The one command the learner can give: a white key with its icon. */
function CommandButton({
  label,
  Icon,
  iconClass,
  disabled,
  onPress,
}: {
  label: string;
  Icon: LucideIcon;
  iconClass: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[390px] px-5 pb-9">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: disabled ? 0.6 : 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.7 }}
        whileTap={disabled ? undefined : { scale: 0.97, y: 3 }}
        disabled={disabled}
        onClick={onPress}
        className="flex h-[58px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-b-4 border-[#D9D6C4] bg-white text-[17px] font-semibold text-[#1F2A44] shadow-[0_4px_14px_rgba(31,42,68,0.12)] active:border-b disabled:cursor-default"
      >
        <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={2} />
        {label}
      </motion.button>
    </div>
  );
}

/** What the instruction did: slides up above Continue. */
function ResultCard({ children }: { children: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="mx-auto mb-1 flex w-[calc(100%-32px)] max-w-[358px] items-center gap-3 rounded-xl bg-white p-2.5 shadow-[0_4px_14px_rgba(31,42,68,0.14)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/level-two/arm-thumb.png" alt="" draggable={false} className="h-[54px] w-[60px] shrink-0 rounded-lg bg-[#E8F1FB] object-cover" />
      <p className="text-[13px] leading-[18px] font-medium text-[#2C2C2C]">{children}</p>
    </motion.div>
  );
}
