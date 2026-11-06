"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, RotateCw } from "lucide-react";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { useBatteryClaim } from "@/components/level-one/useBatteryClaim";
import { vibrateForAnswer } from "@/lib/haptics";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, nextHintId, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { HexBoard } from "./HexBoard";
import { HexScreen } from "./HexScreen";
import { COMMAND_LABEL, GRID, GRID_START, sameTile, type Command } from "./hexGrid";
import { STEP, sequenceNext } from "./sequence";
import { claimReward, noteFirstTry, noteStruggle } from "./sequenceScore";
import { useHexRun } from "./useHexRun";

const BATTERY = { col: 1, row: 1 };
/** Pays the battery once per run of the module, when Hex gets there. */
const REWARD_ID = "sequence-hex-order";
const HINT = "Look at the direction HEX is facing after the first command.";

/** The right order, first slot first. */
const ANSWER: readonly Command[] = ["forward", "right", "forward"];
const FORWARD_TINT = "bg-[#EDFAFE] dark:bg-[#15233A]";
const RIGHT_TINT = "bg-[#FEF8EC] dark:bg-[#2A2218]";
/** MOVE FORWARD can be used twice and TURN RIGHT once. */
const CARDS: readonly ArrangeCardDef[] = [
  { id: "forward-1", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-9 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
  { id: "right-1", kind: "right", text: COMMAND_LABEL.right, art: <RotateCw aria-hidden className="size-9 text-[#E07B1F]" strokeWidth={3} />, tint: RIGHT_TINT },
  { id: "forward-2", kind: "forward", text: COMMAND_LABEL.forward, art: <ArrowUp aria-hidden className="size-9 text-[#0F88E5]" strokeWidth={3} />, tint: FORWARD_TINT },
];
const GEO = arrangeGeometry({ mode: "rows", card: { width: 108, height: 100 }, count: 3, gap: 8, lane: 12, slotsOnTop: true, solidSlots: true });
/** The picture's place (stage px) and how far down the arrange board hangs: its slots start just under the picture, clear of it, and the result panel stays below them. */
const PICTURE_TOP = 160;
const BOARD_TOP = 429;
/** The hint's sentence stands under the board. */
const TIP_TOP = BOARD_TOP + GEO.board.height + 22;
/** How long Hex's first command is left to be seen (ms) before he goes back, on a second go. */
const DEMO_HOLD_MS = 1000;

type Phase = "edit" | "running" | "checked";

/**
 * "Can you put the commands in the right order?": MOVE FORWARD twice and TURN
 * RIGHT once, dragged into three slots, then Hex carries them out from the
 * bottom-left corner. Only forward, right, forward reaches the battery in the
 * middle. After a miss the second go starts with Hex's first command played on
 * its own, so the learner can see which way it sent him.
 */
export function HexOrderScreen() {
  const router = useRouter();
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const { hex, running, play, reset: resetHex } = useHexRun(GRID_START, GRID);
  const [phase, setPhase] = useState<Phase>("edit");
  const [correct, setCorrect] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [hinted, setHinted] = useState(false);
  const [hintCard, setHintCard] = useState<string | null>(null);
  const pending = useRef<number[]>([]);
  const { win, popup } = useBatteryClaim(REWARD_ID, claimReward);

  useEffect(() => {
    const timers = pending.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // Lit until it has been put where it belongs.
  const hintedId = phase === "edit" && nextHintId(CARDS, slots, ANSWER) === hintCard ? hintCard : null;

  const commands = slots.flatMap((id) => {
    const card = CARDS.find((candidate) => candidate.id === id);
    return card ? [card.kind as Command] : [];
  });

  const check = () => {
    setPhase("running");
    play(commands, (end) => {
      const right = sameTile(end, BATTERY);
      setCorrect(right);
      setPhase("checked");
      noteFirstTry(STEP.hexOrder, right);
      if (!right) noteStruggle(STEP.hexOrder, "miss");
      vibrateForAnswer(right);
      setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right }));
      if (right) win();
    });
  };

  const tryAgain = () => {
    const first = commands[0];
    reset();
    resetHex();
    setPhase("edit");
    setAnswer(null);
    setHinted(false);
    setHintCard(null);
    if (!first) return;
    // The first command alone, then back to the start.
    play([first], () => {
      pending.current.push(
        window.setTimeout(() => {
          resetHex();
        }, DEMO_HOLD_MS),
      );
    });
  };

  const onContinue = () => {
    if (phase === "edit") check();
    else if (correct) router.push(sequenceNext(STEP.hexOrder));
    else tryAgain();
  };

  return (
    <HexScreen
      step={STEP.hexOrder}
      title="Can you put the commands in the right order?"
      titleSize={22}
      wrapTitle
      board={<HexBoard kind="grid" hex={hex} battery={BATTERY} width={290} entryKey="hex-order" />}
      boardTop={PICTURE_TOP}
      tip={hinted && phase === "edit" ? HINT : undefined}
      tipTop={TIP_TOP}
      panel={{
        correct,
        title: correct ? "Exactly!" : "Not quite",
        text: correct
          ? "The commands worked because you arranged them in the right order."
          : "Both commands were valid, but their order changed where HEX moved. What should happen before HEX moves toward the battery?",
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
          noteStruggle(STEP.hexOrder, "hint");
        },
      }}
      ctaLabel={phase !== "checked" ? "Check" : correct ? "Next" : "Try again"}
      ctaDisabled={phase === "edit" ? !full || running : phase === "running"}
      onContinue={onContinue}
    >
      <ArrangeDock geo={GEO} top={BOARD_TOP}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={phase !== "edit"} hintedId={hintedId} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
    </HexScreen>
  );
}
