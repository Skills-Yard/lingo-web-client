"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUp, RotateCw } from "lucide-react";
import { aboveButtons, Teal } from "@/components/level-two/LevelTwoShell";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { useBatteryClaim } from "@/components/level-one/useBatteryClaim";
import { vibrateForAnswer } from "@/lib/haptics";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, nextHintId, useArrange, type ArrangeCardDef, type Slots } from "./ArrangeBoard";
import { HexBoard } from "./HexBoard";
import { HexScreen, ReplayButton } from "./HexScreen";
import { COMMAND_LABEL, GRID, GRID_START, sameTile, trace, type Command } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";
import { claimReward, noteFirstTry, noteStruggle } from "./sequenceScore";
import { useHexRun } from "./useHexRun";

const BATTERY = { col: 1, row: 1 };
/** Pays the battery once per run of the module, when Hex gets there. */
const REWARD_ID = "sequence-fix";

const FORWARD_TINT = "bg-[#EDFAFE] dark:bg-[#15233A]";
const RIGHT_TINT = "bg-[#FEF8EC] dark:bg-[#2A2218]";
const CARDS: readonly ArrangeCardDef[] = [
  { id: "forward-1", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-7 shrink-0 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
  { id: "forward-2", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-7 shrink-0 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
  { id: "right-1", kind: "right", text: COMMAND_LABEL.right, art: <RotateCw aria-hidden className="size-7 shrink-0 text-[#E07B1F]" strokeWidth={3} />, tint: RIGHT_TINT },
];
/** The mistake it starts with: forward, forward, right takes Hex up to the corner. */
const BROKEN: Slots = ["forward-1", "forward-2", "right-1"];
/** The right order, first slot first. */
const ANSWER: readonly Command[] = ["forward", "right", "forward"];
const GEO = arrangeGeometry({ mode: "rows", card: { width: 108, height: 84 }, count: 3, gap: 8, lane: 12, slotsOnTop: true, solidSlots: true });
/** Once checked the cards rise this far (px), to stand clear above the result panel, even with its longest text. */
const BOARD_RISE = 200;
/** How far (px) the cards and Replay stand above their usual place over the buttons. */
const LIFT = 50;
/** The pause before the broken sequence plays on its own, and how long Hex is left at the end of it. */
const AUTOPLAY_MS = 800;
const HOLD_MS = 900;

type Phase = "edit" | "running" | "checked";

const kindsOf = (slots: Slots): Command[] =>
  slots.flatMap((id) => {
    const card = CARDS.find((candidate) => candidate.id === id);
    return card ? [card.kind as Command] : [];
  });

/**
 * "Something went wrong!": Hex carries out a wrong order on his own, then the
 * learner drags (or taps) the three commands from the tray into the slots, as
 * on "Arrange the instructions!", can Replay what is there, and Run it. The tip
 * shows only once the hint is asked for. The right order is never
 * shown: a miss keeps their cards, rings the tile Hex's first command took him
 * to, and asks whether he moved as they expected.
 */
export function FixScreen() {
  const router = useRouter();
  const { slots, placeIn, tapCard, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const { hex, running, play, reset } = useHexRun(GRID_START, GRID);
  const [phase, setPhase] = useState<Phase>("edit");
  const [correct, setCorrect] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hintCard, setHintCard] = useState<string | null>(null);
  const [ring, setRing] = useState<{ col: number; row: number } | null>(null);
  const pending = useRef<number[]>([]);
  const { win, popup } = useBatteryClaim(REWARD_ID, claimReward);
  const commands = kindsOf(slots);

  // On opening, the broken sequence plays once, so the learner sees what went wrong.
  useEffect(() => {
    const timers = pending.current;
    timers.push(
      window.setTimeout(
        () =>
          play(kindsOf(BROKEN), () => {
            timers.push(window.setTimeout(() => reset(), HOLD_MS));
          }),
        AUTOPLAY_MS,
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [play, reset]);

  const run = () => {
    setPhase("running");
    setRing(null);
    play(commands, (end) => {
      const right = sameTile(end, BATTERY);
      setCorrect(right);
      setPhase("checked");
      noteFirstTry(STEP.fix, right);
      if (!right) {
        noteStruggle(STEP.fix, "miss");
        // The first move: the tile it takes Hex to (the same one, for a turn).
        const first = trace(GRID_START, commands, GRID)[1];
        setRing({ col: first.col, row: first.row });
      }
      vibrateForAnswer(right);
      setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right }));
      if (right) win();
    });
  };

  const tryAgain = () => {
    reset();
    setPhase("edit");
    setAnswer(null);
  };

  const onContinue = () => {
    if (phase === "edit") run();
    else if (correct) router.push(sequenceNext(STEP.fix));
    else tryAgain();
  };

  return (
    <HexScreen
      step={STEP.fix}
      title={
        <>
          Something went <Teal>wrong!</Teal>
        </>
      }
      board={<HexBoard kind="grid" hex={hex} battery={BATTERY} collected={phase === "checked" && correct} ring={phase === "edit" ? ring : null} width={280} entryKey="hex-fix" />}
      boardTop={130}
      panel={{
        correct,
        title: correct ? "Exactly!" : "Not quite",
        text: correct ? "You fixed the order of the commands." : "Check HEX’s first move, then change the rest.",
        open: phase === "checked",
      }}
      celebrate={phase === "checked" && correct}
      overlay={popup}
      answer={answer}
      hint={{
        visible: phase === "edit",
        onUse: () => {
          setHintCard(nextHintId(CARDS, slots, ANSWER));
          noteStruggle(STEP.fix, "hint");
        },
      }}
      ctaLabel={phase !== "checked" ? "Run" : correct ? "Next" : "Try again"}
      ctaDisabled={phase === "edit" ? !full || running : phase === "running"}
      onContinue={onContinue}
    >
      <motion.div
        initial={false}
        animate={{ y: phase === "checked" ? -BOARD_RISE : 0, opacity: phase === "checked" ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: `calc(${aboveButtons(28, true)} + ${GEO.board.height + 16 + LIFT}px)` }}
      >
        <ReplayButton onPress={() => play(commands)} disabled={phase !== "edit" || running || commands.length === 0} />
      </motion.div>
      <ArrangeDock geo={GEO} withHint rise={LIFT + (phase === "checked" ? BOARD_RISE : 0)}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={phase !== "edit"} hintedId={phase === "edit" && nextHintId(CARDS, slots, ANSWER) === hintCard ? hintCard : null} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
    </HexScreen>
  );
}
