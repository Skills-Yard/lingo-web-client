"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PointedLook, useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { LOOKS, optionState } from "@/components/level-one/TeacherFlow";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, Teal } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { playClickSound } from "@/components/onboarding/clickSound";
import { RAISED } from "@/components/ui/raised";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { fireSceneTrigger } from "@/lib/rive/variableHost";
import { useBubbleSize } from "./bubbleWidth";
import { HEX_ROW_TOP, TrekBackdrop } from "./scenes";
import { OPTION } from "./quiz";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

/** The cards' size, gap, padding, corners, text and rise are `OPTION` (see `quiz.ts`), the same as every other option of the module. */
const ICON = { width: 58, height: 54 };
/** The result panel's own spring (see FeedbackPanel), so the cards rise as it arrives, not after it. */
const PANEL_SPRING = { type: "spring", stiffness: 360, damping: 32 } as const;
/** The cards' own way in (and back down for another try). */
const CARDS_IN = { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } as const;
const CORRECT_ID = "water";

const CHOICES = [
  { id: "water", text: "Water", icon: "/animations/svg/variable-module/screen-2/variable-2.1.svg", tint: "bg-[#EAF6F1] dark:bg-[#12261F]" },
  { id: "football", text: "Football", icon: "/animations/svg/variable-module/screen-2/variable-2.2.svg", tint: "bg-[#FFF1DE] dark:bg-[#2E2314]" },
  { id: "jacket", text: "Jacket", icon: "/animations/svg/variable-module/screen-2/variable-2.3.svg", tint: "bg-[#E6EEFC] dark:bg-[#161E31]" },
] as const;

const SELECTED_RING = "border-[#04ACAB]";
const RIGHT_RING = "border-[#58CC02]";
const WRONG_RING = "border-[#E5484D]";

/** "What do we need now?": the friends are thirsty; the learner picks what they need from three objects. */
/** What Hex says, in a bubble wide enough to hold it in two lines (see `useBubbleSize`). */
const HEX_LINE = "You and your friends are getting thirsty!!!";

export function ThirstyScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const bubble = useBubbleSize(HEX_LINE);
  // The hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();

  const right = selectedId === CORRECT_ID;

  const check = () => {
    answerHint.stop();
    setChecked(true);
    noteAnswer(STEP.thirsty, 0, right);
    if (!right) noteStruggle(STEP.thirsty, "miss");
    // The trail behind cheers a right answer and points at the drink after a wrong one.
    fireSceneTrigger("trek", right ? "cheer" : "drinkHint");
    vibrateForAnswer(right);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: right }));
  };

  const tryAgain = () => {
    setSelectedId(null);
    setChecked(false);
    setAnswer(null);
    setAttempt((previous) => previous + 1);
  };

  const onContinue = () => {
    if (!checked) check();
    else if (right) router.push(variableNext(STEP.thirsty));
    else tryAgain();
  };

  // The hint points at the right answer; it is not picked for the learner.
  const useHint = () => {
    answerHint.press(CORRECT_ID);
    noteStruggle(STEP.thirsty, "hint");
  };

  const panel = checked
    ? right
      ? { title: "Yes!", text: "We need water to drink." }
      : { title: "Not quite", text: "Think about what you drink when thirsty." }
    : null;
  const celebrate = checked && right;

  return (
    <LevelTwoShell
      step={STEP.thirsty}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.thirsty))}
      scene={<TrekBackdrop thirsty lifted={celebrate} />}
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? "Check" : right ? "Next" : "Try again"}
      // Once the answer is checked the hint folds away and Next takes its room.
      hint={{ visible: !checked, onUse: useHint }}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel correct={right} title={panel?.title} open={!!panel} hexIn={!!panel} hexCue={right ? HEX_ONBOARDING_TRIGGER.continueThumb : null} grouped>
            {panel?.text ?? ""}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        What do we <Teal>need</Teal> now?
      </ScreenTitle>
      <CentredRow top={HEX_ROW_TOP}>
        <HexBubble
          key={attempt}
          entryKey={`variable-thirsty-${attempt}`}
          hex="left"
          line={[{ text: HEX_LINE }]}
          size={bubble}
          leaving={checked}
        />
      </CentredRow>

      <motion.div
        initial={{ opacity: 0, y: 90 }}
        // A right answer clears the screen: the cards fade out (and the trail rises into the room Hex and his bubble leave).
        animate={{ opacity: celebrate ? 0 : 1, y: checked ? -OPTION.rise : 0 }}
        transition={checked ? { y: PANEL_SPRING, opacity: { duration: 0.4, ease: "easeOut" } } : CARDS_IN}
        className="pointer-events-auto absolute z-[1] grid grid-cols-3"
        style={{ bottom: aboveButtons(OPTION.aboveButtons, true), left: COLUMN_LEFT, width: COLUMN_W, gap: OPTION.gap }}
      >
        {CHOICES.map((choice) => {
          const state = optionState(choice.id, selectedId, checked, CORRECT_ID);
          // At rest a thin grey line and a faint shade (as every option); picked, right or wrong a 4px ring. The padding makes up the border's width, so a card is as wide either way.
          const ring = state === "selected" ? SELECTED_RING : state === "correct" ? RIGHT_RING : state === "wrong" ? WRONG_RING : "border-[#DCE2E9] drop-shadow-[0_1px_2px_rgba(31,42,68,0.07)] dark:border-white/10";
          return (
            <motion.button
              key={choice.id}
              type="button"
              data-hint={choice.id}
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                answerHint.stop();
                setSelectedId(choice.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: OPTION.pictureHeight, borderRadius: OPTION.radius, paddingInline: state === "idle" ? OPTION.padX - 1 : OPTION.padX - 4 }}
              className={`relative isolate flex min-w-0 cursor-pointer flex-col items-center justify-center gap-2 ${state === "idle" ? "border" : "border-4"} ${RAISED} ${LOOKS[state].edge} ${choice.tint} ${ring}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={choice.icon} alt="" {...ICON} draggable={false} className="select-none" />
              <span className="leading-6 font-semibold text-[#444444] dark:text-white" style={{ fontSize: OPTION.font }}>
                {choice.text}
              </span>
              <PointedLook pointed={answerHint.pointedId === choice.id && state === "idle"} />
            </motion.button>
          );
        })}
      </motion.div>
      {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
      {answerHint.hand}

      <Confetti active={celebrate} />
      <XpBurst show={celebrate} />
    </LevelTwoShell>
  );
}
