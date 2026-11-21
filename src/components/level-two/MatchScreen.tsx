"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { motion, type Transition } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED } from "@/components/ui/raised";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { useTheme } from "@/context/ThemeContext";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "./LevelTwoShell";
import { RightBounce } from "./RightBounce";
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

/**
 * Each theme's layout (frame px, the 390 x 844 frame): where the column headers
 * start (`chipTop`), their height, the gap under them, a card's width and height,
 * the gap between the two rows and between the two columns. Light's are the
 * "Command_7" design: headers at 178, cards at 238 and 451, 166 x 187, columns
 * 25 apart (so 16px in from each side). Dark's are from the "Command_6" design.
 */
const METRICS = {
  light: { chipTop: 178, chipH: 40, chipGap: 20, cardW: 166, cardH: 187, rowGap: 26, columnGap: 25 },
  dark: { chipTop: 262, chipH: 36, chipGap: 18, cardW: 172, cardH: 186, rowGap: 30, columnGap: 30 },
} as const;
/** The column headers: what each column holds (light's label is singular in the design). */
const CHIPS = [
  { side: "left", light: "Instruction", dark: "Instructions", box: "bg-[#F6F4FE] dark:bg-[#2E2A5C]", title: "text-[#8E82FF] dark:text-[#A79BFF]" },
  { side: "right", light: "Actions", dark: "Actions", box: "bg-[#FFF9F0] dark:bg-[#4A3418]", title: "text-[#FF8D42] dark:text-[#FF9D3D]" },
] as const;
/** A wrong pair shakes red for this long (seconds), and both cards let go this long (ms) after it was made. */
const SHAKE_S = 0.28;
const WRONG_MS = 300;
/**
 * A right pair bounces with the module's own bounce (`RightBounce`, as the Data Types
 * match does): both cards turn green and bounce at once, with its shine and stars,
 * and are disabled from the start. Each goes gray the moment it first comes down
 * from the big jump.
 */
/** The shine of a card that is waiting for its match (below), and none at rest. */
const SHINE_OFF = { x: -60, opacity: 0 };
const shineOn = (cardW: number) => ({ x: [-60, cardW + 20], opacity: [0, 1, 1, 0] });
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
 * `/module/commands?step=6` — "Can you match them?": tap an instruction, then
 * the action it does. The tapped card bounces and turns blue. A right pair
 * turns green and bounces together (`RightBounce`, with its shine and stars),
 * disabled from the start, then each card goes gray as it comes down from the
 * jump; a wrong pair shakes red and lets go. Next
 * unlocks once all are matched. It is not graded: the screen can't be left until
 * every pair is right. The hint lights up a pair: the one with the card already
 * picked, or else the first still open.
 */
export function MatchScreen() {
  const router = useRouter();
  const theme = useTheme().theme;
  const metrics = METRICS[theme];
  const columnsW = metrics.cardW * 2 + metrics.columnGap;
  /** A card row's top (frame px): right under the column headers, `chipGap` below them. */
  const rowTop = (row: number) => metrics.chipTop + metrics.chipH + metrics.chipGap + row * (metrics.cardH + metrics.rowGap);
  const [picked, setPicked] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matched, setMatched] = useState<readonly string[]>([]);
  // The matched cards that have come down from their bounce and gone gray.
  const [settled, setSettled] = useState<readonly string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [hinted, setHinted] = useState<readonly string[]>([]);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = matched.length === INSTRUCTIONS.length * 2;

  const showHint = () => {
    const instruction =
      INSTRUCTIONS.find((card) => card.id === picked.left || card.pair === picked.right) ??
      INSTRUCTIONS.find((card) => !matched.includes(card.id));
    if (instruction) setHinted([instruction.id, instruction.pair]);
  };

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
      // A right pair: bouncing (green), then gray once it has come down; it is disabled throughout.
      const matchedNow = look === "correct" || look === "done";
      // A card is picked in the other column and none yet in this one.
      const waiting = look === "idle" && !picked[side] && !!picked[side === "left" ? "right" : "left"];
      const hintHere = look === "idle" && hinted.includes(card.id);
      const face =
        look === "idle"
          ? `border-white duration-250 dark:border-[#818185] ${tint}`
          : look === "selected"
            ? BLUE_CARD
            : look === "correct"
              ? `${LOOKS.correct.card} duration-150`
              : look === "done"
                ? GRAY_CARD
                : LOOKS.wrong.card;
      const edge = look === "idle" ? EDGE.khaki : look === "selected" ? EDGE.blue : look === "done" ? EDGE.pale : look === "wrong" ? EDGE.red : EDGE.green;
      return (
        <HintFloat className="relative" spin={false} active={hintHere}>
        {/* A right match bounces at once (the moment the learner can tell it is right) and goes gray as it first comes down from the jump. */}
        <RightBounce play={matchedNow} radius={8} onDrop={() => setSettled((now) => (now.includes(card.id) ? now : [...now, card.id]))}>
        <motion.button
          type="button"
          onClick={() => pick(side, card.id)}
          aria-pressed={look === "selected"}
          disabled={matchedNow}
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: 1,
            y: waiting ? WAIT_FLOAT : 0,
            x: look === "wrong" ? [0, -7, 7, -5, 5, 0] : waiting ? WAIT_SHAKE : 0,
            scale: look === "selected" ? [1, 0.96, 1.04, 1] : waiting ? WAIT_SCALE : 1,
          }}
          whileTap={{ scale: 0.97 }}
          transition={{
            opacity: { duration: 0.3, delay: 0.15 + row * 0.1 },
            y: waiting ? WAIT_FLOAT_TRANSITION : { type: "spring", stiffness: 110, damping: 13, delay: 0.15 + row * 0.1 },
            x: { duration: waiting ? WAIT_NUDGE_S : SHAKE_S },
            scale: { duration: waiting ? WAIT_NUDGE_S : 0.4 },
          }}
          className={`pointer-events-auto relative isolate flex cursor-pointer flex-col items-center justify-center gap-3.5 overflow-hidden rounded-[8px] border-4 px-2 ${RAISED} ${edge} disabled:cursor-default dark:gap-1 dark:border-2 ${face}`}
          style={{ width: metrics.cardW, height: metrics.cardH }}
        >
          {/* The hint's orange fill, wiped in from the left behind the content. */}
          <motion.span
            aria-hidden
            initial={false}
            animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
            transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
            className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
          />
          {/* Light: Figma's 90 x 90 icon box (the action pictures are 80 x 80 with 10px under them). */}
          <span
            className={`flex h-22.5 w-22.5 shrink-0 items-center justify-center transition-opacity duration-150 dark:h-28 dark:w-full ${side === "right" ? "pb-2.5 dark:pb-0" : ""} ${look === "done" ? "opacity-50" : ""}`}
          >
            <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
          </span>
          <span className={`text-center text-[16px] leading-none font-semibold text-[#444444] transition-opacity duration-150 dark:text-[14px] dark:leading-5 dark:text-white ${look === "done" ? "opacity-50" : ""}`}>
            {card.text}
          </span>
          <motion.span
            aria-hidden
            initial={false}
            animate={waiting ? shineOn(metrics.cardW) : SHINE_OFF}
            transition={waiting ? WAIT_SHINE_TRANSITION : SHINE_TRANSITION}
            style={{ skewX: -20 }}
            className={`pointer-events-none absolute inset-y-0 left-0 w-14 ${
              waiting
                ? "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)]"
                : "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]"
            }`}
          />
        </motion.button>
        </RightBounce>
        </HintFloat>
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
      hint={{ visible: !done, onUse: showHint }}
      onContinue={() => router.push(levelTwoHref(7))}
    >
      <ScreenTitle>
        Can you <Teal>match them?</Teal>
      </ScreenTitle>

      {/* The column headers, just under the title. */}
      <div
        className="absolute flex justify-between"
        style={{ top: stageTop(metrics.chipTop), left: `calc(50% - ${columnsW / 2}px)`, width: columnsW, height: metrics.chipH }}
      >
        {CHIPS.map((chip) => (
          <div key={chip.side} className="flex justify-center" style={{ width: metrics.cardW }}>
            {/* Figma's header: just the word, 12px padding, 16px / 600. */}
            <div className={`flex h-full w-fit items-center rounded-[8px] px-3 dark:rounded-[10px] ${chip.box}`}>
              <p className={`text-[16px] leading-none font-semibold dark:text-[14px] dark:leading-5 ${chip.title}`}>{theme === "dark" ? chip.dark : chip.light}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The cards, centred in the room between the headers and the buttons (never closer to the headers than `chipGap`). */}
      {(
        [
          ["left", INSTRUCTIONS, "bg-[#F6F4FE] dark:bg-[#0F1F26]"],
          ["right", ACTIONS, "bg-[#FFF9F0] dark:bg-[#0F1F26]"],
        ] as const
      ).map(([side, cards, tint], columnIndex) =>
        cards.map((card, row) => (
          <div
            key={card.id}
            className="absolute"
            style={{ top: stageTop(rowTop(row)), left: `calc(50% - ${columnsW / 2}px + ${columnIndex * (metrics.cardW + metrics.columnGap)}px)` }}
          >
            {renderCard(side, card, row, tint)}
          </div>
        )),
      )}
    </LevelTwoShell>
  );
}
