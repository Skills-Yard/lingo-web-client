"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { optionState } from "@/components/level-one/TeacherFlow";
import { GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { playClickSound } from "@/components/onboarding/clickSound";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { TrekBackdrop } from "./TrekScreen";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

const BUBBLE_TOP = 178;
const CARD_H = 108;
const CARD_GAP = 10;
const ICON = { width: 53, height: 49 };
/** The result panel makes room by raising the cards this far (px). */
const RISE = 150;
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
export function ThirstyScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const right = selectedId === CORRECT_ID;

  const check = () => {
    setChecked(true);
    noteAnswer(STEP.thirsty, 0, right);
    if (!right) noteStruggle(STEP.thirsty, "miss");
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
      scene={<TrekBackdrop />}
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={!checked ? "Continue" : right ? "Next" : "Try again"}
      onContinue={onContinue}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel correct={right} title={panel?.title} open={!!panel} hexIn={!!panel} hexCue={right ? HEX_ONBOARDING_TRIGGER.continueThumb : null}>
            {panel?.text ?? ""}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine>
        What do we <Teal>need</Teal> now?
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble
          key={attempt}
          entryKey={`variable-thirsty-${attempt}`}
          hex="left"
          line={[{ text: "You and your friends are getting thirsty!!!" }]}
          size={{ width: 190 }}
          leaving={checked}
        />
      </CentredRow>

      <motion.div
        initial={{ opacity: 0, y: 90 }}
        animate={{ opacity: 1, y: checked ? -RISE : 0 }}
        transition={checked ? PANEL_SPRING : CARDS_IN}
        className="pointer-events-auto absolute z-[1] grid grid-cols-3"
        style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS), left: COLUMN_LEFT, width: COLUMN_W, gap: CARD_GAP }}
      >
        {CHOICES.map((choice) => {
          const state = optionState(choice.id, selectedId, checked, CORRECT_ID);
          const ring = state === "selected" ? SELECTED_RING : state === "correct" ? RIGHT_RING : state === "wrong" ? WRONG_RING : "border-white dark:border-transparent";
          return (
            <motion.button
              key={choice.id}
              type="button"
              disabled={checked}
              onClick={() => {
                playClickSound();
                vibrateForTap();
                setSelectedId(choice.id);
              }}
              aria-pressed={state === "selected"}
              animate={{ scale: state === "selected" ? [1, 0.95, 1.05, 1] : 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ height: CARD_H }}
              className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-4 px-1 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] transition-colors ${choice.tint} ${ring}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={choice.icon} alt="" {...ICON} draggable={false} className="select-none" />
              <span className="text-[15px] leading-5 font-semibold text-[#444444] dark:text-white">{choice.text}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <Confetti active={celebrate} />
      <XpBurst show={celebrate} />
    </LevelTwoShell>
  );
}
