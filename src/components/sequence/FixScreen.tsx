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
const DESCRIPTION = "HEX followed every command, but it didn’t reach the battery. Can you fix the sequence?";
const HINT = "Think about which direction HEX needs to move before it starts moving forward.";

const FORWARD_TINT = "bg-[#EDFAFE] dark:bg-[#15233A]";
const RIGHT_TINT = "bg-[#FEF8EC] dark:bg-[#2A2218]";
const CARDS: readonly ArrangeCardDef[] = [
  { id: "forward-1", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-5 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
  { id: "forward-2", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-5 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
  { id: "right-1", kind: "right", text: COMMAND_LABEL.right, art: <RotateCw aria-hidden className="size-5 text-[#E07B1F]" strokeWidth={3} />, tint: RIGHT_TINT },
];
/** The mistake it starts with: forward, forward, right takes Hex up to the corner. */
const BROKEN: Slots = ["forward-1", "forward-2", "right-1"];
/** The right order, first slot first. */
const ANSWER: readonly Command[] = ["forward", "right", "forward"];
const GEO = arrangeGeometry({ mode: "rows", card: { width: 104, height: 64 }, count: 3, gap: 10, tray: false });
/** Once checked the cards rise this far (px), to stand clear above the result panel, even with its longest text. */
const BOARD_RISE = 200;
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
 * "Something went wrong!": the three commands start in a wrong order that Hex
 * has just carried out (it plays once on its own). The learner drags them to
 * swap places, can Replay what is there, and Run it. The right order is never
 * shown: a miss keeps their cards, rings the tile Hex's first command took him
 * to, and asks whether he moved as they expected.
 */
export function FixScreen() {
  const router = useRouter();
  const { slots, placeIn } = useArrange(CARDS.map((card) => card.id), GEO.count, BROKEN);
  const { hex, running, play, reset } = useHexRun(GRID_START, GRID);
  const [phase, setPhase] = useState<Phase>("edit");
  const [correct, setCorrect] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
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
      board={<HexBoard kind="grid" hex={hex} battery={BATTERY} ring={phase === "edit" ? ring : null} width={280} entryKey="hex-fix" />}
      boardTop={130}
      tip={hinted ? HINT : DESCRIPTION}
      tipTop={350}
      panel={{
        correct,
        title: correct ? "Exactly!" : "Not quite",
        text: correct ? "You found the problem in the order of the commands." : "Did HEX move in the direction you expected? Look at his first move, then change the rest.",
        open: phase === "checked",
      }}
      celebrate={phase === "checked" && correct}
      overlay={popup}
      answer={answer}
      hint={{
        visible: phase === "edit",
        onUse: () => {
          setHinted(true);
          setHintCard(nextHintId(CARDS, slots, ANSWER));
          noteStruggle(STEP.fix, "hint");
        },
      }}
      ctaLabel={phase !== "checked" ? "Run" : correct ? "Next" : "Try again"}
      ctaDisabled={phase === "running"}
      onContinue={onContinue}
    >
      <motion.div
        initial={false}
        animate={{ y: phase === "checked" ? -BOARD_RISE : 0, opacity: phase === "checked" ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: `calc(${aboveButtons(28, true)} + ${GEO.board.height + 16}px)` }}
      >
        <ReplayButton onPress={() => play(commands)} disabled={phase !== "edit" || running} />
      </motion.div>
      <ArrangeDock geo={GEO} withHint rise={phase === "checked" ? BOARD_RISE : 0}>
        {/* Cards can only be swapped: dropped anywhere but a slot, one snaps back. */}
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={phase !== "edit"} hintedId={phase === "edit" && nextHintId(CARDS, slots, ANSWER) === hintCard ? hintCard : null} onPlace={(id, slot) => slot !== null && placeIn(id, slot)} />
      </ArrangeDock>
    </HexScreen>
  );
}
