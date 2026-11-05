"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import type { BubbleSize, Span } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

const LINE: readonly Span[] = [{ text: "You’re preparing a cup of tea. Arrange these actions into a sensible order." }];
const BUBBLE: BubbleSize = { width: 250 };
const BUBBLE_TOP = 150;

const emoji = (symbol: string) => (
  <span aria-hidden className="text-[30px] leading-none">
    {symbol}
  </span>
);
/** Listed with the pouring first, so the tray doesn't give the order away. */
const CARDS: readonly ArrangeCardDef[] = [
  { id: "pour", kind: "pour", text: "Pour the hot water into a cup", art: emoji("☕"), tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
  { id: "heat", kind: "heat", text: "Heat the water", art: emoji("🔥"), tint: "bg-[#FFF3DE] dark:bg-[#2A2218]" },
  { id: "bag", kind: "bag", text: "Add the tea bag", art: emoji("🍃"), tint: "bg-[#ECF7ED] dark:bg-[#10261A]" },
];

const GEO = arrangeGeometry({ mode: "columns", card: { width: 150, height: 112 }, count: 3, gap: 10, lane: 24 });
/** Once checked the board rises this far (px), so the result panel doesn't cover it. */
const BOARD_RISE = 160;

/**
 * "One last challenge.": the same idea away from the robot. Three tea-making
 * actions are dragged into order. Any order is right as long as the water is
 * heated before it is poured (the tea bag can go in first or last).
 */
export function TeaScreen() {
  const router = useRouter();
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const correct = full && slots.indexOf("heat") < slots.indexOf("pour");

  const check = () => {
    setChecked(true);
    noteFirstTry(STEP.tea, correct);
    if (!correct) noteStruggle(STEP.tea, "miss");
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  const tryAgain = () => {
    reset();
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(STEP.tea));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={STEP.tea}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(STEP.tea))}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaDisabled={!full}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
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
            {correct ? "You used the same idea in a different situation." : "What needs to happen before you can pour hot water?"}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        One last <Teal>challenge.</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble key={attempt} entryKey={`tea-${attempt}`} hex="left" line={LINE} size={BUBBLE} leaving={checked} />
      </CentredRow>
      <ArrangeDock geo={GEO} rise={checked ? BOARD_RISE : 0}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={checked} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
