"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { motion, type Transition } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "./LevelTwoShell";
import { SlotImage } from "./SlotImage";
import { levelTwoHref } from "./levelTwo";

type Card = { id: string; text: string; icon: string; /** The id of the card it goes with. */ pair: string };

/** Figma's two columns: instructions on the left, what they do on the right. */
const INSTRUCTIONS: readonly Card[] = [
  { id: "pickup", text: "Pick Up", icon: "step-11.1.svg", pair: "lift" },
  { id: "putdown", text: "Put Down", icon: "step-11.3.svg", pair: "release" },
];
const ACTIONS: readonly Card[] = [
  { id: "release", text: "Release the cube", icon: "step-11.2.svg", pair: "putdown" },
  { id: "lift", text: "Lift the cube", icon: "step-11.4.svg", pair: "pickup" },
];

/** The column headers start 181px down the frame; the cards' rows follow them. */
const CHIP_TOP = 181;
const CHIP_H = 52;
const CHIP_GAP = 10;
const CARD_W = 172;
const CARD_H = 140;
const GAP = 14;
/** Between the two columns: they sit out toward the screen's edges, 8px in on the 390px frame. */
const COLUMN_GAP = 30;
const COLUMNS_W = CARD_W * 2 + COLUMN_GAP;
const ROW_TOP = [CHIP_TOP + CHIP_H + CHIP_GAP, CHIP_TOP + CHIP_H + CHIP_GAP + CARD_H + GAP] as const;
/** The column headers: what each column holds. */
const CHIPS = [
  { side: "left", icon: "match-instructions.svg", label: "Instructions", sub: "What to do", box: "bg-[#F1EEFF]", title: "text-[#5B3FD0]" },
  { side: "right", icon: "match-actions.svg", label: "Actions", sub: "How it looks in the robot", box: "bg-[#FFF4E3]", title: "text-[#A85B00]" },
] as const;
/** A wrong pair shakes red for this long (seconds), and both cards let go this long (ms) after it was made. */
const SHAKE_S = 0.28;
const WRONG_MS = 300;
/**
 * A right pair, in 1.2s: both cards lift 16px as they scale up, float there for a
 * moment, then glide slowly back down to their place and size. They turn green as
 * they rise and gray as they come down, and are disabled from the start.
 */
const LIFT = [null, -16, -12, 0];
const LIFT_SCALE = [null, 1.06, 1.06, 1];
const LIFT_TRANSITION: Transition = { duration: 1.2, times: [0, 0.2, 0.45, 1], ease: ["easeOut", "easeInOut", "easeInOut"] };
/** They go gray this long (ms) after the match: as they start to come down. */
const GRAY_AFTER_MS = 540;
/** The shine: a slim slanted band, very light, crossing each matched card from left to right as they lift. */
const SHINE_OFF = { x: -60, opacity: 0 };
const SHINE_ON = { x: [-60, CARD_W + 20], opacity: [0, 1, 1, 0] };
const SHINE_TRANSITION: Transition = {
  x: { duration: 0.27, ease: "easeInOut", delay: 0.03 },
  opacity: { duration: 0.27, times: [0, 0.2, 0.8, 1], delay: 0.03 },
};
/**
 * With a card picked, the other column's open cards show they are next: one scale
 * up and shake, then a gentle float and a brighter shine that loop until the pick is made.
 */
const WAIT_NUDGE_S = 0.45;
const WAIT_SCALE = [1, 1.05, 1];
const WAIT_SHAKE = [0, -4, 4, -3, 3, 0];
const WAIT_FLOAT = [0, -5, 0];
const WAIT_FLOAT_TRANSITION: Transition = { duration: 1.8, ease: "easeInOut", repeat: Infinity, delay: WAIT_NUDGE_S };
const WAIT_SHINE_TRANSITION: Transition = {
  x: { duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.9, delay: WAIT_NUDGE_S },
  opacity: { duration: 0.9, times: [0, 0.2, 0.8, 1], repeat: Infinity, repeatDelay: 0.9, delay: WAIT_NUDGE_S },
};
/** A right pair's colours fade over 0.15s (Tailwind's `duration-150`): blue to green to gray. A wrong pair's red fades back to normal over 0.25s (`duration-250`, on the idle look). */
const BLUE_CARD = "border-[#5B9BFF] bg-[#EEF4FF] dark:bg-[#15213A]";
const GRAY_CARD = "border-[#E3E5E9] bg-[#F1F2F4] duration-150 dark:border-white/10 dark:bg-[#1A1D23]";

type Side = "left" | "right";

/**
 * `/module?step=6` — "Can you match them?": tap an instruction, then
 * the action it does. The tapped card bounces and turns blue. A right pair
 * turns green together as it lifts (with a light shine across it), then goes
 * gray and disabled as it comes down; a wrong pair shakes red and lets go. Next
 * unlocks once all are matched. It is not graded: the screen can't be left until
 * every pair is right.
 */
export function MatchScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matched, setMatched] = useState<readonly string[]>([]);
  // The matched cards that have gone gray.
  const [settled, setSettled] = useState<readonly string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const settleTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      settleTimers.current.forEach((settle) => window.clearTimeout(settle));
    },
    [],
  );

  const done = matched.length === INSTRUCTIONS.length * 2;

  const pick = (side: Side, id: string) => {
    if (wrong || matched.includes(id)) return;
    playClickSound();
    vibrateForTap();
    const next = { ...picked, [side]: picked[side] === id ? null : id };
    setPicked(next);
    if (!next.left || !next.right) return;
    const instruction = INSTRUCTIONS.find((card) => card.id === next.left);
    const right = instruction?.pair === next.right;
    vibrateForAnswer(right);
    const lastPair = matched.length + 2 === INSTRUCTIONS.length * 2;
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right, partial: right && !lastPair }));
    if (right) {
      const pair = [next.left, next.right];
      setMatched((now) => [...now, ...pair]);
      setPicked({ left: null, right: null });
      settleTimers.current.push(window.setTimeout(() => setSettled((now) => [...now, ...pair]), GRAY_AFTER_MS));
    } else {
      setWrong(true);
      timer.current = window.setTimeout(() => {
        setWrong(false);
        setPicked({ left: null, right: null });
      }, WRONG_MS);
    }
  };

  const state = (side: Side, card: Card) => {
    if (settled.includes(card.id)) return "done" as const;
    if (matched.includes(card.id)) return "correct" as const;
    if (picked[side] !== card.id) return "idle" as const;
    return wrong ? ("wrong" as const) : ("selected" as const);
  };

  const renderCard = (side: Side, card: Card, row: number, tint: string) => {
      const look = state(side, card);
      // A right pair: lifting (green), then coming down (gray); it is disabled throughout.
      const matchedNow = look === "correct" || look === "done";
      // A card is picked in the other column and none yet in this one.
      const waiting = look === "idle" && !picked[side] && !!picked[side === "left" ? "right" : "left"];
      const face =
        look === "idle"
          ? `border-white duration-250 dark:border-transparent ${tint}`
          : look === "selected"
            ? BLUE_CARD
            : look === "correct"
              ? `${LOOKS.correct.card} duration-150`
              : look === "done"
                ? GRAY_CARD
                : LOOKS.wrong.card;
      return (
        <motion.button
          type="button"
          onClick={() => pick(side, card.id)}
          aria-pressed={look === "selected"}
          disabled={matchedNow}
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: 1,
            y: matchedNow ? LIFT : waiting ? WAIT_FLOAT : 0,
            x: look === "wrong" ? [0, -7, 7, -5, 5, 0] : waiting ? WAIT_SHAKE : 0,
            scale: matchedNow ? LIFT_SCALE : look === "selected" ? [1, 0.96, 1.04, 1] : waiting ? WAIT_SCALE : 1,
          }}
          whileTap={{ scale: 0.97 }}
          transition={{
            opacity: { duration: 0.3, delay: 0.15 + row * 0.1 },
            y: matchedNow ? LIFT_TRANSITION : waiting ? WAIT_FLOAT_TRANSITION : { type: "spring", stiffness: 110, damping: 13, delay: 0.15 + row * 0.1 },
            x: { duration: waiting ? WAIT_NUDGE_S : SHAKE_S },
            scale: matchedNow ? LIFT_TRANSITION : { duration: waiting ? WAIT_NUDGE_S : 0.4 },
          }}
          className={`pointer-events-auto relative isolate flex cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-[8px] border-4 px-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] disabled:cursor-default ${face}`}
          style={{ width: CARD_W, height: CARD_H }}
        >
          <span className={`flex h-[92px] w-full items-center justify-center transition-opacity duration-150 ${look === "done" ? "opacity-50" : ""}`}>
            <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
          </span>
          <span className={`text-center text-[14px] leading-5 font-semibold text-[#444444] transition-opacity duration-150 dark:text-white ${look === "done" ? "opacity-50" : ""}`}>
            {card.text}
          </span>
          <motion.span
            aria-hidden
            initial={false}
            animate={matchedNow || waiting ? SHINE_ON : SHINE_OFF}
            transition={waiting ? WAIT_SHINE_TRANSITION : SHINE_TRANSITION}
            style={{ skewX: -20 }}
            className={`pointer-events-none absolute inset-y-0 left-0 w-14 ${
              waiting
                ? "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]"
                : "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]"
            }`}
          />
        </motion.button>
      );
  };

  return (
    <LevelTwoShell
      step={6}
      voiceover={MODULE_AUDIO.match}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaLabel="Next"
      ctaDisabled={!done}
      onContinue={() => router.push(levelTwoHref(7))}
    >
      <ScreenTitle>
        Can you <Teal>match them?</Teal>
      </ScreenTitle>

      {/* The column headers. */}
      <div
        className="absolute flex justify-between"
        style={{ top: stageTop(CHIP_TOP), left: `calc(50% - ${COLUMNS_W / 2}px)`, width: COLUMNS_W, height: CHIP_H }}
      >
        {CHIPS.map((chip) => (
          <div key={chip.side} className={`flex items-center gap-1.5 rounded-[10px] px-2 ${chip.box}`} style={{ width: CARD_W }}>
            <SlotImage file={chip.icon} className="h-6 w-6 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className={`text-[16px] leading-5 font-bold ${chip.title}`}>{chip.label}</p>
              <p className="text-[10.5px] leading-[14px] font-medium whitespace-nowrap text-[#555555]">{chip.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {(
        [
          ["left", INSTRUCTIONS, "bg-[#F6F4FE] dark:bg-[#1B1830]"],
          ["right", ACTIONS, "bg-[#FFF9F0] dark:bg-[#2A2218]"],
        ] as const
      ).map(([side, cards, tint], columnIndex) =>
        cards.map((card, row) => (
          <div
            key={card.id}
            className="absolute"
            style={{ top: stageTop(ROW_TOP[row]), left: `calc(50% - ${COLUMNS_W / 2}px + ${columnIndex * (CARD_W + COLUMN_GAP)}px)` }}
          >
            {renderCard(side, card, row, tint)}
          </div>
        )),
      )}
    </LevelTwoShell>
  );
}
