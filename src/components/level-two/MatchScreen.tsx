"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { FILL_S, HintFloat } from "@/components/level-one/HintFloat";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
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
/** Its place in the module. */
const STEP = 6;
/** How long a wrong pair shows red before both cards let go. */
const WRONG_MS = 650;

type Side = "left" | "right";

/**
 * `/module?step=6` — "Can you match them?": tap an instruction, then
 * the action it does. A right pair turns green and stays; a wrong pair shakes
 * red and lets go. Next unlocks once both are matched.
 */
export function MatchScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState<{ left: string | null; right: string | null }>({ left: null, right: null });
  const [matched, setMatched] = useState<readonly string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Whether any pair has been wrong in this go.
  const slipped = useRef(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);

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
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right }));
    if (right) {
      setMatched((now) => [...now, next.left!, next.right!]);
      setPicked({ left: null, right: null });
      setHinted(false);
    } else {
      slipped.current = true;
      noteAnswer(STEP, false);
      setWrong(true);
      timer.current = window.setTimeout(() => {
        setWrong(false);
        setPicked({ left: null, right: null });
      }, WRONG_MS);
    }
  };

  const state = (side: Side, card: Card) => {
    if (matched.includes(card.id)) return "correct" as const;
    if (picked[side] !== card.id) return "idle" as const;
    return wrong ? ("wrong" as const) : ("selected" as const);
  };

  const renderCard = (side: Side, card: Card, row: number, tint: string) => {
      const look = state(side, card);
      const hintHere = hinted && !!hintPair && (card.id === hintPair.id || card.id === hintPair.pair) && look === "idle";
      return (
        <HintFloat className="relative" spin={false} active={hintHere}>
          <motion.button
            type="button"
            onClick={() => pick(side, card.id)}
            aria-pressed={look === "selected"}
            disabled={look === "correct"}
            initial={{ opacity: 0, y: 40 }}
            animate={{
              opacity: 1,
              y: 0,
              x: look === "wrong" ? [0, -7, 7, -5, 5, 0] : 0,
              scale: look === "selected" ? [1, 0.96, 1.04, 1] : 1,
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ opacity: { duration: 0.3, delay: 0.15 + row * 0.1 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.15 + row * 0.1 }, x: { duration: 0.4 }, scale: { duration: 0.4 } }}
            className={`pointer-events-auto relative isolate flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[8px] border-4 px-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-[background-color,border-color] disabled:cursor-default ${
              look === "idle" ? `border-white dark:border-transparent ${tint}` : LOOKS[look].card
            }`}
            style={{ width: CARD_W, height: CARD_H }}
          >
            <motion.span
              aria-hidden
              initial={false}
              animate={{ clipPath: hintHere ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
              transition={{ duration: FILL_S, ease: [0.45, 0, 0.25, 1] }}
              className="pointer-events-none absolute inset-0 -z-10 bg-[#FFE7D1] dark:bg-[#33220F]"
            />
            <span className="flex h-[100px] w-full items-center justify-center">
              <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
            </span>
            <span className="text-center text-[14px] leading-5 font-semibold text-[#444444] dark:text-white">{card.text}</span>
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
      onContinue={() => {
        // Right only if no pair was wrong on the way (the first go is what is noted).
        const correct = !slipped.current;
        noteAnswer(STEP, correct);
        router.push(nextAfter(STEP, correct, levelTwoHref(7)));
      }}
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
