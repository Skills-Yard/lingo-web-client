"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue } from "@/components/level-two/RobotBackdrop";
import { SlotImage } from "@/components/level-two/SlotImage";
import type { BubbleSize, Span } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, SEQUENCE_STEPS, sequenceNext, sequencePrevious } from "./sequence";
import { noteFirstTry } from "./sequenceScore";

const STEP = 5;
const LINE: readonly Span[] = [{ text: "Drag to help robot place the cube in target area" }];
const BUBBLE: BubbleSize = { width: 190 };
const BUBBLE_TOP = 150;

type CardId = "pickup" | "target";
const CARDS: readonly { id: CardId; text: string; icon: string; tint: string }[] = [
  { id: "pickup", text: "Pick Up", icon: PICK_UP_ICON, tint: "bg-[#ECF7ED] dark:bg-[#10261A]" },
  { id: "target", text: "Place in Target", icon: PLACE_IN_TARGET_ICON, tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
];
/** The right order, first slot first. */
const ANSWER: readonly CardId[] = ["pickup", "target"];

const CARD = { width: 136, height: 104 };
const COLUMN_GAP = 32;
const ROW_GAP = 12;
const BOARD = { width: CARD.width * 2 + COLUMN_GAP, height: CARD.height * 2 + ROW_GAP };
/** A card dropped within this far (px) of a slot's centre goes in it. */
const DROP_REACH = 90;
/** Below this far (px) a press and release is a tap, not a drag. */
const TAP_SLOP = 6;
/** On a miss the board rises this far (px), so the result panel doesn't cover it. */
const BOARD_RISE = 110;
const CARD_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;

type Point = { x: number; y: number };
const homeOf = (index: number): Point => ({ x: 0, y: index * (CARD.height + ROW_GAP) });
const slotOf = (index: number): Point => ({ x: CARD.width + COLUMN_GAP, y: index * (CARD.height + ROW_GAP) });

/** The two slots, first slot first; `null` is an open one. */
type Slots = readonly (CardId | null)[];
const EMPTY: Slots = [null, null];

/** The slot a card dropped with its corner at `at` lands in, if any. */
const slotAt = (at: Point) => {
  const distance = (index: number) => Math.hypot(at.x - slotOf(index).x, at.y - slotOf(index).y);
  const nearest = distance(0) <= distance(1) ? 0 : 1;
  return distance(nearest) <= DROP_REACH ? nearest : null;
};

/**
 * Follows the pointer by hand: the stage is scaled as one piece, so the pointer's
 * screen px are converted to the stage's, which a library's drag doesn't do.
 */
function ArrangeCard({
  card,
  at,
  disabled,
  onDrop,
  onTap,
}: {
  card: (typeof CARDS)[number];
  at: Point;
  disabled: boolean;
  onDrop: (to: Point) => void;
  onTap: () => void;
}) {
  const x = useMotionValue(at.x);
  const y = useMotionValue(at.y);
  const drag = useRef<{ startX: number; startY: number; fromX: number; fromY: number; scale: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (drag.current) return;
    const animations = [animate(x, at.x, CARD_SPRING), animate(y, at.y, CARD_SPRING)];
    return () => animations.forEach((animation) => animation.stop());
  }, [at.x, at.y, x, y]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={card.text}
      onPointerDown={(event) => {
        const box = event.currentTarget;
        box.setPointerCapture(event.pointerId);
        drag.current = {
          startX: event.clientX,
          startY: event.clientY,
          fromX: x.get(),
          fromY: y.get(),
          scale: box.getBoundingClientRect().width / box.offsetWidth || 1,
          moved: false,
        };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const now = drag.current;
        if (!now) return;
        const dx = event.clientX - now.startX;
        const dy = event.clientY - now.startY;
        if (Math.hypot(dx, dy) > TAP_SLOP) now.moved = true;
        x.set(now.fromX + dx / now.scale);
        y.set(now.fromY + dy / now.scale);
      }}
      onPointerUp={() => {
        const now = drag.current;
        drag.current = null;
        setDragging(false);
        if (!now) return;
        if (now.moved) onDrop({ x: x.get(), y: y.get() });
        else onTap();
        // Back to its place if nothing changed; a move gets here through `at`.
        animate(x, at.x, CARD_SPRING);
        animate(y, at.y, CARD_SPRING);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        animate(x, at.x, CARD_SPRING);
        animate(y, at.y, CARD_SPRING);
      }}
      animate={{ scale: dragging ? 1.05 : 1 }}
      style={{ x, y, width: CARD.width, height: CARD.height, zIndex: dragging ? 2 : 1 }}
      className={`pointer-events-auto absolute top-0 left-0 flex touch-none flex-col items-center justify-center gap-1.5 rounded-[8px] border-4 border-white px-1.5 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] enabled:cursor-grab enabled:active:cursor-grabbing dark:border-transparent ${card.tint}`}
    >
      <span className="flex h-[46px] w-full items-center justify-center">
        <SlotImage file={card.icon} className="max-h-full max-w-full object-contain" />
      </span>
      <span className="text-center text-[14px] leading-[18px] font-semibold text-[#444444] dark:text-white">{card.text}</span>
    </motion.button>
  );
}

/**
 * "Arrange the instructions!": drag each instruction into its numbered slot (a
 * tap sends it to the first open slot, and back out again). With both placed the
 * main button checks the order: the right one and the robot carries it out; a
 * wrong one is tried again from the start.
 */
export function ArrangeScreen() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slots>(EMPTY);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const correct = ANSWER.every((id, index) => slots[index] === id);
  const full = slots.every((slot) => slot !== null);

  const placeIn = (id: CardId, slot: number | null) => {
    playClickSound();
    vibrateForTap();
    setSlots((now) => {
      const from = now.indexOf(id);
      const next = [...now];
      if (from >= 0) next[from] = null;
      if (slot !== null) {
        // A card already there takes the place this one came from, or goes home.
        if (from >= 0) next[from] = now[slot];
        next[slot] = id;
      }
      return next;
    });
  };

  const tapCard = (id: CardId) => placeIn(id, slots.includes(id) ? null : slots.indexOf(null));

  const check = () => {
    setChecked(true);
    noteFirstTry(STEP, correct);
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    if (correct) {
      fireRobot("pickUp");
      fireRobot("placeInTarget");
    } else {
      fireRobot("wrongClaw");
    }
  };

  const tryAgain = () => {
    setSlots(EMPTY);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(STEP));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={STEP}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(STEP))}
      scene={<RobotBackdrop below={robotBelowDialogue(BUBBLE_TOP, BUBBLE)} pose="idle" />}
      answer={answer}
      ctaDisabled={!full}
      ctaLabel={!checked ? "Continue" : correct ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? "Nice!" : "Not quite"}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
          >
            {correct ? "The robot followed your order, and the cube reached the target." : "The robot can’t place a cube it hasn’t picked up. What should it do first?"}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        Arrange the <Teal>instructions!</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble key={attempt} entryKey={`arrange-${attempt}`} hex="left" line={LINE} size={BUBBLE} leaving={checked} />
      </CentredRow>
      {/* A right order fades the board, so the robot carrying it out can be seen. */}
      <motion.div
        initial={false}
        animate={{ y: checked && !correct ? -BOARD_RISE : 0, opacity: checked && correct ? 0 : 1 }}
        transition={PANEL_SPRING}
        className="absolute left-1/2 z-[1]"
        style={{ bottom: aboveButtons(28), width: BOARD.width, height: BOARD.height, marginLeft: -BOARD.width / 2 }}
      >
        {EMPTY.map((_, index) => (
          <div
            key={index}
            aria-hidden
            className="absolute flex items-center justify-center rounded-[8px] border-2 border-dashed border-[#9AA3AE] bg-white/70 dark:border-white/30 dark:bg-white/5"
            style={{ left: slotOf(index).x, top: slotOf(index).y, width: CARD.width, height: CARD.height }}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-[#D9DEE3] text-[15px] font-semibold text-[#5C6670] dark:bg-white/15 dark:text-white/70">
              {index + 1}
            </span>
          </div>
        ))}
        {CARDS.map((card, index) => {
          const placed = slots.indexOf(card.id);
          return (
            <ArrangeCard
              key={card.id}
              card={card}
              at={placed >= 0 ? slotOf(placed) : homeOf(index)}
              disabled={checked}
              onDrop={(to) => placeIn(card.id, slotAt(to))}
              onTap={() => tapCard(card.id)}
            />
          );
        })}
      </motion.div>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
