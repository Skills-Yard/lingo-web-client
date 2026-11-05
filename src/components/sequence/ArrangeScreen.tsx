"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { RobotBackdrop, robotBelowDialogue } from "@/components/level-two/RobotBackdrop";
import { SlotImage } from "@/components/level-two/SlotImage";
import type { BubbleSize, Span } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

const LINE: readonly Span[] = [{ text: "Help the robot place the cube in the target area." }];
const BUBBLE: BubbleSize = { width: 190 };
const BUBBLE_TOP = 150;

const art = (file: string) => <SlotImage file={file} className="max-h-full max-w-full object-contain" />;
const CARDS: readonly ArrangeCardDef[] = [
  { id: "pickup", kind: "pickup", text: "Pick Up", art: art(PICK_UP_ICON), tint: "bg-[#ECF7ED] dark:bg-[#10261A]" },
  { id: "target", kind: "target", text: "Place in Target", art: art(PLACE_IN_TARGET_ICON), tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
];
/** The right order, first slot first. */
const ANSWER = ["pickup", "target"];

const GEO = arrangeGeometry({ mode: "columns", card: { width: 136, height: 104 }, count: 2 });
/** On a miss the board rises this far (px), so the result panel doesn't cover it. */
const BOARD_RISE = 110;

/**
 * "Arrange the instructions!": drag each instruction into its numbered slot (a
 * tap sends it to the first open slot, and back out again). With both placed the
 * main button checks the order: the right one and the robot carries it out; a
 * wrong one is tried again from the start.
 */
export function ArrangeScreen() {
  const router = useRouter();
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const correct = ANSWER.every((kind, index) => CARDS.find((card) => card.id === slots[index])?.kind === kind);

  const check = () => {
    setChecked(true);
    noteFirstTry(STEP.arrange, correct);
    if (!correct) noteStruggle(STEP.arrange, "miss");
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
    reset();
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(STEP.arrange));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={STEP.arrange}
      total={SEQUENCE_STEPS}
      voiceover={checked ? undefined : SEQUENCE_AUDIO.arrange}
      onBack={() => router.push(sequencePrevious(STEP.arrange))}
      scene={<RobotBackdrop below={robotBelowDialogue(BUBBLE_TOP, BUBBLE)} pose="idle" />}
      answer={answer}
      ctaDisabled={!full}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? "Perfect!" : "Not quite"}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct
              ? "First, the robot picked up the cube. Then it placed the cube on the target."
              : "The robot needs to be holding the cube before it can place it. Which command should come first?"}
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
      <ArrangeDock geo={GEO} rise={checked && !correct ? BOARD_RISE : 0} fade={checked && correct}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={checked} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
