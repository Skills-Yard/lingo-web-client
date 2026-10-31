"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Transition } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
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

/** Figma: the column chips start 181px down the frame, the cards' rows at 231 and 440. */
const ROW_TOP = [231, 440] as const;
const CARD_W = 172;
const CARD_H = 184;
const GAP = 14;
/** A wrong pair shakes red for this long (seconds), and both cards let go this long (ms) after it was made. */
const SHAKE_S = 0.28;
const WRONG_MS = 300;
/**
 * A right pair, in 0.35s: both cards lift 14px and drop back, with one small dip
 * below their place before they settle (each leg eased so the motion slows at the
 * top and speeds into the landing, never stopping dead). They turn green as they
 * rise and gray as they come down, and are disabled from the start.
 */
const LIFT = [0, -14, 0, 3, 0];
const LIFT_TRANSITION: Transition = { duration: 0.35, times: [0, 0.33, 0.67, 0.83, 1], ease: ["easeOut", "easeIn", "easeOut", "easeInOut"] };
/** They go gray this long (ms) after the match: as they start to come down. */
const GRAY_AFTER_MS = 170;
/** The shine: a slim slanted band, very light, crossing each matched card from left to right as they lift. */
const SHINE_OFF = { x: -60, opacity: 0 };
const SHINE_ON = { x: [-60, CARD_W + 20], opacity: [0, 1, 1, 0] };
const SHINE_TRANSITION: Transition = {
  x: { duration: 0.27, ease: "easeInOut", delay: 0.03 },
  opacity: { duration: 0.27, times: [0, 0.2, 0.8, 1], delay: 0.03 },
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
  const [hinted, setHinted] = useState(false);
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
  // The hint points at the first pair still open.
  const hintPair = INSTRUCTIONS.find((card) => !matched.includes(card.id));

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
      setHinted(false);
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
      const hintHere = hinted && !!hintPair && (card.id === hintPair.id || card.id === hintPair.pair) && look === "idle";
      // A right pair: lifting (green), then coming down (gray); it is disabled throughout.
      const matchedNow = look === "correct" || look === "done";
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
        <HintFloat className="relative" spin={false} active={hintHere}>
          <motion.button
            type="button"
            onClick={() => pick(side, card.id)}
            aria-pressed={look === "selected"}
            disabled={matchedNow}
            initial={{ opacity: 0, y: 40 }}
            animate={{
              opacity: 1,
              y: matchedNow ? LIFT : 0,
              x: look === "wrong" ? [0, -7, 7, -5, 5, 0] : 0,
              scale: look === "selected" ? [1, 0.96, 1.04, 1] : 1,
            }}
            whileTap={{ scale: 0.97 }}
            transition={{
              opacity: { duration: 0.3, delay: 0.15 + row * 0.1 },
              y: matchedNow ? LIFT_TRANSITION : { type: "spring", stiffness: 110, damping: 13, delay: 0.15 + row * 0.1 },
              x: { duration: SHAKE_S },
              scale: { duration: 0.4 },
            }}
            className={`pointer-events-auto relative isolate flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border-4 px-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] disabled:cursor-default ${face}`}
            style={{ width: CARD_W, height: CARD_H }}
          >
            <motion.span
              aria-hidden
              initial={false}
              animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
              transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
              className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
            />
            <span className={`flex h-[100px] w-full items-center justify-center transition-opacity duration-150 ${look === "done" ? "opacity-50" : ""}`}>
              <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
            </span>
            <span className={`text-center text-[14px] leading-5 font-semibold text-[#444444] transition-opacity duration-150 dark:text-white ${look === "done" ? "opacity-50" : ""}`}>
              {card.text}
            </span>
            <motion.span
              aria-hidden
              initial={false}
              animate={matchedNow ? SHINE_ON : SHINE_OFF}
              transition={SHINE_TRANSITION}
              style={{ skewX: -20 }}
              className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]"
            />
          </motion.button>
        </HintFloat>
      );
  };

  return (
    <LevelTwoShell
      step={6}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaLabel="Next"
      ctaDisabled={!done}
      hint={{ visible: true, onUse: () => setHinted(true) }}
      onContinue={() => router.push(levelTwoHref(7))}
    >
      <ScreenTitle>
        Can you <Teal>match them?</Teal>
      </ScreenTitle>

      {/* The column chips. */}
      {(
        [
          { side: "left", label: "Instruction", color: "text-[#8E82FF] bg-[#F6F4FE]" },
          { side: "right", label: "Actions", color: "text-[#FF8D42] bg-[#FFF9F0]" },
        ] as const
      ).map((chip) => (
        <span
          key={chip.side}
          className={`absolute rounded-md px-3 py-1 text-center text-[14px] leading-5 font-medium ${chip.color}`}
          style={{
            top: stageTop(181),
            left: `calc(50% - 179px + ${chip.side === "left" ? 0 : CARD_W + GAP}px)`,
            width: CARD_W,
          }}
        >
          {chip.label}
        </span>
      ))}

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
            style={{ top: stageTop(ROW_TOP[row]), left: `calc(50% - 179px + ${columnIndex * (CARD_W + GAP)}px)` }}
          >
            {renderCard(side, card, row, tint)}
          </div>
        )),
      )}
    </LevelTwoShell>
  );
}
