"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SlotImage } from "@/components/level-two/SlotImage";
import type { BubbleSize, Span } from "@/components/level-two/levelTwo";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { ArrangeBoard, arrangeGeometry, useArrange, type ArrangeCardDef } from "./ArrangeBoard";
import { STEP } from "./sequence";
import { SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";
import { noteFirstTry, noteStruggle } from "./sequenceScore";

/*
 * "One last challenge!" (place 24 of the 3D flow, from a Figma crop): the title, the character's face with
 * the line in a bubble, three empty slots right under that row, and the three steps in a tray standing a
 * little above the main button. There is no picture on the screen (no robot, no room), so the slots hang from
 * the row and the cards from the button: what is spare on a tall screen is between them. Both are one board
 * (`ArrangeBoard`), laid out with the space between its slots and its tray measured from the box they fill.
 */

const LINE: readonly Span[] = [{ text: "Time for tea! Arrange the steps in order." }];
/** The design's bubble: 154 wide, the short one (77 tall), three lines. */
const BUBBLE: BubbleSize = { width: 154, short: true };
const BUBBLE_TOP = 150;
/** Where the slots start (Figma `top`), and how far (px) the tray's foot stands above the main button. */
const SLOTS_TOP = 285;
const TRAY_GAP = 44;
/** The cards and slots: 112 x 119, 12 apart (read off the crop). */
const CARD = { width: 112, height: 119 };
const GAP = 12;
/** The least space between the slots and the tray. */
const MIN_LANE = 14;

const picture = (n: 1 | 2 | 3) => <SlotImage file={`/animations/svg/sequence-3d/3d-24-${n}.svg`} className="size-[52px] max-h-none max-w-none object-contain" />;
/** Listed with the pouring first, so the tray doesn't give the order away. */
const CARDS: readonly ArrangeCardDef[] = [
  { id: "pour", kind: "pour", text: "Pour tea", art: picture(1), tint: "bg-[#FFF9F0] dark:bg-[#2A2218]" },
  { id: "heat", kind: "heat", text: "Heat water", art: picture(2), tint: "bg-[#F6F4FE] dark:bg-[#1B1830]" },
  { id: "bag", kind: "bag", text: "Add tea bag", art: picture(3), tint: "bg-[#E5EFFD] dark:bg-[#15233A]" },
];

/**
 * Three tea-making actions are dragged into order. Any order is right as long as the water is heated before it is
 * poured (the tea bag can go in first or last). Check, then the result panel; a wrong order is tried again.
 */
export function Tea3DScreen({ position }: { position: number }) {
  const router = useRouter();
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), 3);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const correct = full && slots.indexOf("heat") < slots.indexOf("pour");
  // The wrong message depends on what was put first.
  const wrongNote = slots[0] === "pour" ? { title: "Oops!", text: "There’s no hot water yet. Heat it first!" } : { title: "Not quite", text: "Heat the water before you pour it." };

  // The box between the row and the main button: the slots are at its top, the tray at its foot.
  const dock = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const element = dock.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const geo = useMemo(
    () => arrangeGeometry({ mode: "rows", card: CARD, count: 3, gap: GAP, lane: Math.max(MIN_LANE, height - 2 * CARD.height), slotsOnTop: true, designSlots: true }),
    [height],
  );

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
    else if (correct) router.push(sequence3dNext(position));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={position}
      total={SEQUENCE_3D_STEPS}
      onBack={() => router.push(sequence3dPrevious(position))}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaDisabled={!full}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? "Nice!" : wrongNote.title}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            centred
          >
            {correct ? "Same idea, new situation. Order matters!" : wrongNote.text}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        One last <Teal>challenge!</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble key={attempt} entryKey={`tea-${attempt}`} hex="left" line={LINE} size={BUBBLE} withBubble />
      </CentredRow>
      {/* Stays where it is when the result comes (the panel is over it): nothing on this screen shifts. */}
      <div
        ref={dock}
        className="absolute left-1/2 z-0"
        style={{ top: stageTop(SLOTS_TOP), bottom: aboveButtons(TRAY_GAP), width: geo.board.width, marginLeft: -geo.board.width / 2 }}
      >
        {height > 0 && <ArrangeBoard cards={CARDS} slots={slots} geo={geo} disabled={checked} hideShadows={checked} onPlace={placeIn} onTap={tapCard} />}
      </div>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
