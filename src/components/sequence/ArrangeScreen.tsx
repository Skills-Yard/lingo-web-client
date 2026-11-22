"use client";

import { useEffect, useRef, useState } from "react";
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
import { COMMAND_ROBOT, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, STEP } from "./sequence";
import { useSequenceFlow } from "./sequenceFlow";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

const LINE: readonly Span[] = [{ text: "Drag to help robot place the cube in target area" }];
const BUBBLE: BubbleSize = { width: 200 };
const BUBBLE_TOP = 150;

const art = (file: string) => <SlotImage file={file} className="max-h-full max-w-full object-contain" />;
const CARDS: readonly ArrangeCardDef[] = [
  { id: "target", kind: "target", text: "Place in Target", art: art(PLACE_IN_TARGET_ICON), tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
  { id: "pickup", kind: "pickup", text: "Pick Up", art: art(PICK_UP_ICON), tint: "bg-[#ECF7ED] dark:bg-[#10261A]" },
];
/**
 * The 3D route's cards (Figma `sequence_12`): three, for the two slots, so one is the extra (the commands module's "Put Down", which is
 * never right here and falls away on Check). Their pictures are 52 x 36 in a 52 px box, the first card's name in lower case as drawn.
 * The design shows Pick Up twice (the third in lavender); the user asked for a different name on the extra one.
 */
const art3d = (file: string) => <SlotImage file={file} className="h-[36px] w-[52px] object-contain" />;
const PUT_DOWN_ICON = "/images/level-two/step-13.2.svg";
const CARDS_3D: readonly ArrangeCardDef[] = [
  { id: "target", kind: "target", text: "Place in target", art: art3d(PLACE_IN_TARGET_ICON), tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
  { id: "pickup", kind: "pickup", text: "Pick Up", art: art3d(PICK_UP_ICON), tint: "bg-[#FFF4F6] dark:bg-[#2B1A1E]" },
  { id: "putdown", kind: "putdown", text: "Put Down", art: art3d(PUT_DOWN_ICON), tint: "bg-[#F6F4FE] dark:bg-[#1B1830]" },
];
/** The right order, first slot first. */
const ANSWER = ["pickup", "target"];

/** Two cards across the whole content column: 2 x 166 + 8 = 340, as wide as the three-card boards (3 x 108 + 2 x 8). */
const GEO = arrangeGeometry({ mode: "rows", card: { width: 166, height: 116 }, count: 2, gap: 8, lane: 14, slotsOnTop: true, solidSlots: true });
/**
 * The 3D route's board (Figma `sequence_12`): two 112 x 119 dashed slots, centred over a row of three 112 x 119 cards, 14 apart, so a card fills the
 * slot it is dropped in. Like everything on the stage it is laid out in the 390 px frame and scaled with it, so the proportions are the same on every device.
 */
const GEO_3D = arrangeGeometry({ mode: "rows", card: { width: 112, height: 119 }, count: 2, cardCount: 3, gap: 14, lane: 14, slotsOnTop: true, designSlots: true });
/** On the 3D route the board waits this long (s) after Check for the extra card to fall before it clears. */
const EXTRA_DROP_S = 0.4;
/** On a right order the board rises this far (px) as it fades. */
const BOARD_RISE = 110;
/** On a miss the robot gets it wrong first: the result comes once its clip has played. */
const WRONG_MOVE_MS = COMMAND_ROBOT.moveSeconds.wrongClaw * 1000;

/**
 * "Arrange the instructions!": drag each instruction into its numbered slot (a
 * tap sends it to the first open slot, and back out again). With both placed the
 * main button checks the order and the board clears so the robot can be seen: on
 * the right one it carries it out; on a wrong one it plays its wrong move, then the
 * result comes up and it is tried again from the start.
 */
export function ArrangeScreen() {
  const router = useRouter();
  const flow = useSequenceFlow();
  const geo = flow.designSlots ? GEO_3D : GEO;
  const cards = flow.designSlots ? CARDS_3D : CARDS;
  const { slots, placeIn, tapCard, reset, full } = useArrange(cards.map((card) => card.id), geo.count);
  const [checked, setChecked] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const resultTimer = useRef<number | undefined>(undefined);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const correct = ANSWER.every((kind, index) => cards.find((card) => card.id === slots[index])?.kind === kind);

  useEffect(() => () => window.clearTimeout(resultTimer.current), []);

  const showResult = () => {
    setResultShown(true);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  const check = () => {
    setChecked(true);
    noteFirstTry(STEP.arrange, correct);
    if (!correct) noteStruggle(STEP.arrange, "miss");
    vibrateForAnswer(correct);
    if (correct) {
      showResult();
      fireRobot("pickUp");
      fireRobot("placeInTarget");
    } else {
      fireRobot("wrongClaw");
      resultTimer.current = window.setTimeout(showResult, WRONG_MOVE_MS);
    }
  };

  const tryAgain = () => {
    reset();
    setChecked(false);
    setResultShown(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(flow.next(STEP.arrange));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={flow.position(STEP.arrange)}
      total={flow.total}
      voiceover={checked ? undefined : SEQUENCE_AUDIO.arrange}
      onBack={() => router.push(flow.previous(STEP.arrange))}
      scene={<RobotBackdrop below={robotBelowDialogue(BUBBLE_TOP, BUBBLE)} pose="idle" />}
      answer={answer}
      ctaDisabled={!full || (checked && !resultShown)}
      ctaLabel={!resultShown ? "Check" : correct ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? "Perfect!" : "Oops!"}
            open={resultShown}
            hexIn={resultShown}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct
              ? "The robot picked up the cube, then placed it."
              : "You can’t place a cube you’re not holding. What comes first?"}
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
      {/* Once checked the board fades, so the robot can be seen; a right order also sends it up as it goes. */}
      {/* On the 3D route the extra card falls away first (it is in no slot), then the board clears. */}
      <ArrangeDock geo={geo} rise={checked && correct ? BOARD_RISE : 0} fade={checked} fadeDelay={flow.designSlots ? EXTRA_DROP_S : 0}>
        <ArrangeBoard cards={cards} slots={slots} geo={geo} disabled={checked} dropUnused={flow.designSlots && checked} hideShadows={resultShown} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
