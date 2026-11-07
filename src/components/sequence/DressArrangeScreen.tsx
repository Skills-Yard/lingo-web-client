"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import type { BubbleSize } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { parseOnboardingAnswers, readOnboardingAnswersJson } from "@/lib/onboardingAnswers";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { DressScene, HOP_SECONDS, type DressStage } from "./DressScene";
import { IMAGES, SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

const BUBBLE: BubbleSize = { width: 190 };
const BUBBLE_TOP = 150;
const subscribeNever = () => () => {};

const art = (file: string) => <SlotImage file={`${IMAGES}/${file}`} className="max-h-full max-w-full object-contain" />;
/** Shoes are listed first, so the right first card isn't the first one in the tray. */
const CARDS: readonly ArrangeCardDef[] = [
  { id: "shoes", kind: "shoes", text: "Put Shoes", art: art("put-on-shoes.webp"), tint: "bg-[#FFF9F0] dark:bg-[#0F1F26]" },
  { id: "socks", kind: "socks", text: "Put Socks", art: art("put-on-socks.webp"), tint: "bg-[#F6F4FE] dark:bg-[#0F1F26]" },
];
/** The right order, first slot first. */
const ANSWER = ["socks", "shoes"];

const GEO = arrangeGeometry({ mode: "rows", card: { width: 110, height: 116 }, count: 2, gap: 16, lane: 14, slotsOnTop: true, solidSlots: true });
/** On a right order the board rises this far (px) as it fades. */
const BOARD_RISE = 110;
/** On a miss he tries it first: the result comes once the room has played that. */
const WRONG_MOVE_MS = 2500;
/** Time between one item landing and the next going on. */
const GAP_MS = HOP_SECONDS * 1000 + 700;

type Phase = "edit" | "socks" | "shoes";

/**
 * "Arrange the instructions!" for getting ready: drag PUT SOCKS and PUT SHOES
 * into their slots. The right order plays out on the scene (socks, then
 * shoes); on the wrong one the board clears and he tries the socks over
 * his shoes, then the result comes up.
 */
export function DressArrangeScreen() {
  const router = useRouter();
  const json = useSyncExternalStore(subscribeNever, readOnboardingAnswersJson, () => "");
  const name = useMemo(() => parseOnboardingAnswers(json).name?.trim(), [json]);
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const [checked, setChecked] = useState(false);
  const [resultShown, setResultShown] = useState(false);
  const resultTimer = useRef<number | undefined>(undefined);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("edit");
  const correct = ANSWER.every((kind, index) => CARDS.find((card) => card.id === slots[index])?.kind === kind);

  // The right order is played out one item at a time.
  useEffect(() => {
    if (!checked || !correct) return;
    const timers = [
      window.setTimeout(() => setPhase("socks"), 300),
      window.setTimeout(() => setPhase("shoes"), 300 + GAP_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [checked, correct]);

  useEffect(() => () => window.clearTimeout(resultTimer.current), []);

  const showResult = () => {
    setResultShown(true);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  const check = () => {
    setChecked(true);
    noteFirstTry(STEP.dress, correct);
    if (!correct) noteStruggle(STEP.dress, "miss");
    vibrateForAnswer(correct);
    if (correct) showResult();
    else resultTimer.current = window.setTimeout(showResult, WRONG_MOVE_MS);
  };

  const tryAgain = () => {
    reset();
    setChecked(false);
    setResultShown(false);
    setAnswer(null);
    setPhase("edit");
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (correct) router.push(sequenceNext(STEP.dress));
    else tryAgain();
  };

  const socks: DressStage = phase === "edit" ? "rug" : "worn";
  const shoes: DressStage = phase === "shoes" ? "worn" : "rug";
  const line = useMemo(() => [{ text: `Help ${name || "your friend"} get ready` }], [name]);

  return (
    <LevelTwoShell
      step={STEP.dress}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(STEP.dress))}
      scene={
        <DressScene
          socks={correct ? socks : "rug"}
          shoes={correct ? shoes : "rug"}
          trySocks={checked && !correct}
        />
      }
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
            {correct ? "Socks first, then shoes. Ready to go!" : "Socks must go on before shoes."}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        Arrange the <Teal>instructions!</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble key={attempt} entryKey={`dress-${attempt}`} hex="left" line={line} size={BUBBLE} leaving={checked} />
      </CentredRow>
      {/* Once checked the board fades, so what he does can be seen; a right order also sends it up as it goes. */}
      <ArrangeDock geo={GEO} rise={checked && correct ? BOARD_RISE : 0} fade={checked}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={checked} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
