"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { HEX_ROW_TOP, TrekBackdrop } from "./scenes";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { fireSceneTrigger } from "@/lib/rive/variableHost";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import { parseTitle } from "./quiz";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";
import { CalculatorApp } from "./visuals";

const TITLE = parseTitle("Plan the *App's Steps*");

const TINT = "bg-[#F6F4FE] dark:bg-[#0F1F26]";
/** Listed out of order, so the tray doesn't give the plan away. */
const CARDS: readonly ArrangeCardDef[] = [
  { id: "add", kind: "add", text: "Add both numbers.", tint: TINT },
  { id: "ask-first", kind: "ask-first", text: "Ask for the first number.", tint: TINT },
  { id: "keep-second", kind: "keep-second", text: "Keep the second number.", tint: TINT },
  { id: "show", kind: "show", text: "Display the result.", tint: TINT },
  { id: "ask-second", kind: "ask-second", text: "Ask for the second number.", tint: TINT },
  { id: "keep-first", kind: "keep-first", text: "Keep the first number.", tint: TINT },
];
/** The right order, first step first. */
const ANSWER = ["ask-first", "keep-first", "ask-second", "keep-second", "add", "show"];

const GEO = arrangeGeometry({ mode: "columns", card: { width: 150, height: 52 }, count: ANSWER.length, gap: 8, lane: 24, sentence: true });
/** Once checked a wrong plan rises this far (px), so the result panel doesn't cover it. */
const BOARD_RISE = 170;
/** The example run of the finished plan: when each part shows (ms after it is right). */
const EXAMPLE_MS = { first: 500, second: 1500, result: 2600 } as const;

/**
 * "Plan the App's Steps": six steps of the addition application to be
 * dragged into order (ask, keep, ask, keep, add, display). A right plan runs as
 * an example (10 and 20 are asked for and kept, and 30 is shown); a wrong one is
 * tried again. This is the point where the learner sees why the app has to keep
 * the two numbers.
 */
export function PlanAppScreen() {
  const router = useRouter();
  const { slots, placeIn, tapCard, reset, full } = useArrange(CARDS.map((card) => card.id), GEO.count);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [example, setExample] = useState({ first: false, second: false, result: false });
  const correct = ANSWER.every((id, index) => slots[index] === id);

  // The example fills in as the numbers are asked for, kept and added.
  useEffect(() => {
    if (!checked || !correct) return;
    const timers = (["first", "second", "result"] as const).map((part) => window.setTimeout(() => setExample((now) => ({ ...now, [part]: true })), EXAMPLE_MS[part]));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [checked, correct]);

  const check = () => {
    setChecked(true);
    noteAnswer(STEP.plan, 0, correct);
    if (!correct) noteStruggle(STEP.plan, "miss");
    // The trail behind cheers a right plan.
    if (correct) fireSceneTrigger("trek", "cheer");
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
    else if (correct) router.push(variableNext(STEP.plan));
    else tryAgain();
  };

  return (
    <LevelTwoShell
      step={STEP.plan}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.plan))}
      scene={<TrekBackdrop lifted={checked && correct} />}
      answer={answer}
      ctaDisabled={!full}
      ctaLabel={!checked ? "Check" : correct ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? "Excellent!" : "Not quite"}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
          >
            {correct
              ? "You planned the app's logic."
              : "Can an app add before it has both numbers?"}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine={!TITLE.twoLines}>
        <span style={{ fontSize: TITLE.size }}>
          {TITLE.parts.map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="text-level-gradient">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: HEX_ROW_TOP }}>
        <HexBubble key={attempt} entryKey={`variable-plan-${attempt}`} hex="left" line={[{ text: "Put the steps for our addition app in order." }]} size={{ width: 190 }} leaving={checked} />
      </div>
      {checked && correct && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute inset-x-0 flex flex-col items-center gap-2" style={{ top: 210 }}>
          <span className="text-[13px] leading-5 font-semibold text-[#6B7480] dark:text-white/60">The plan, running</span>
          <CalculatorApp first={example.first ? "10" : ""} second={example.second ? "20" : ""} result={example.result ? "30" : ""} />
        </motion.div>
      )}
      {/* A right plan fades the board, so the example running can be seen. */}
      <ArrangeDock geo={GEO} rise={checked && !correct ? BOARD_RISE : 0} fade={checked && correct}>
        <ArrangeBoard cards={CARDS} slots={slots} geo={GEO} disabled={checked} onPlace={placeIn} onTap={tapCard} />
      </ArrangeDock>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
