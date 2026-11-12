"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { COLUMN_LEFT } from "@/components/level-two/levelTwo";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED } from "@/components/ui/raised";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer, vibrateForTap } from "@/lib/haptics";
import { COLUMN_W } from "@/lib/questionColumn";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { fireSceneTrigger, setSceneValues } from "@/lib/rive/variableHost";
import { HEX_ROW_TOP, MiniAppBackdrop } from "./scenes";
import { IDLE_LOOK, OPTION, parseTitle } from "./quiz";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

const TITLE = parseTitle("Plan the *App's Steps*");

/** The steps, listed out of order, so the list doesn't give the plan away. */
const STEPS = [
  { id: "add", text: "Add both numbers." },
  { id: "ask-first", text: "Ask for the first number." },
  { id: "keep-second", text: "Keep the second number." },
  { id: "show", text: "Display the result." },
  { id: "ask-second", text: "Ask for the second number." },
  { id: "keep-first", text: "Keep the first number." },
] as const;
/** The right order, first step first. */
const ANSWER = ["ask-first", "keep-first", "ask-second", "keep-second", "add", "show"];

/** The steps' own way in. */
const STEPS_IN = { opacity: { duration: 0.3, delay: 0.3 }, y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 } } as const;
/** The example run of the finished plan on the app: when each part shows (ms after it is right). */
const EXAMPLE_MS = { first: 500, second: 1500, result: 2600 } as const;

/**
 * "Plan the App's Steps": the six steps of the addition application, to be tapped in the order the app does them (ask,
 * keep, ask, keep, add, display). The app on a phone (the same artboard as the screen before, "VAR_MiniApp", see
 * `MiniAppBackdrop`) is the scene, and the steps stand under it; each step tapped shows its place in the plan on a
 * green round badge at its top left, and tapping a step again takes it out. A right plan runs as an example on the app
 * (10 and 20 are asked for and kept, and 30 is shown); a wrong one is tried again. This is the point where the learner
 * sees why the app has to keep the two numbers.
 */
export function PlanAppScreen() {
  const router = useRouter();
  const [order, setOrder] = useState<readonly string[]>([]);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const full = order.length === STEPS.length;
  const correct = full && ANSWER.every((id, index) => order[index] === id);

  // The app starts empty, as on the screen before: nothing asked for yet, no result.
  useEffect(() => {
    setSceneValues("miniApp", {
      mode: 0,
      title: "Addition App",
      name1: "first_number",
      name2: "second_number",
      resultName: "result",
      formula: "result = first_number + second_number",
      val1: "10",
      val2: "20",
      result: 30,
      filled: 0,
      showResult: false,
      bug: false,
      highlight: 0,
    });
  }, [attempt]);

  // A right plan runs: the numbers are asked for and kept, then the result is shown.
  useEffect(() => {
    if (!checked || !correct) return;
    const timers = [
      window.setTimeout(() => setSceneValues("miniApp", { filled: 1 }), EXAMPLE_MS.first),
      window.setTimeout(() => setSceneValues("miniApp", { filled: 2 }), EXAMPLE_MS.second),
      window.setTimeout(() => setSceneValues("miniApp", { showResult: true }), EXAMPLE_MS.result),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [checked, correct]);

  const pick = (id: string) => {
    playClickSound();
    vibrateForTap();
    setOrder((now) => (now.includes(id) ? now.filter((other) => other !== id) : [...now, id]));
  };

  const check = () => {
    setChecked(true);
    noteAnswer(STEP.plan, 0, correct);
    if (!correct) noteStruggle(STEP.plan, "miss");
    // The app marks a right plan and a wrong one.
    fireSceneTrigger("miniApp", correct ? "correct" : "wrong");
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
  };

  const tryAgain = () => {
    setOrder([]);
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
      scene={<MiniAppBackdrop lifted={checked} />}
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
            grouped
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
        <HexBubble key={attempt} entryKey={`variable-plan-${attempt}`} hex="left" line={[{ text: "Tap the steps for our app in order." }]} size={{ width: 190 }} leaving={checked} />
      </div>
      {/* The steps stand under the app, on the white below it, two across. Three rows of them (196px) do not fit between the risen app and the result panel, so any check fades them in place (they never rise over the app): a right plan then runs on the app, a wrong one gets the result panel and a try again. */}
      <motion.div
        initial={{ opacity: 0, y: 90 }}
        animate={{ opacity: checked ? 0 : 1, y: 0 }}
        transition={checked ? { opacity: { duration: 0.4, ease: "easeOut" } } : STEPS_IN}
        className="pointer-events-auto absolute z-[1] grid grid-cols-2"
        style={{ bottom: aboveButtons(OPTION.aboveButtons), left: COLUMN_LEFT, width: COLUMN_W, gap: OPTION.gap, pointerEvents: checked ? "none" : undefined }}
      >
        {STEPS.map((step) => {
          const place = order.indexOf(step.id);
          const picked = place >= 0;
          // Once a wrong plan is checked, the steps that are not in their place show red.
          const misplaced = checked && !correct && picked && ANSWER[place] !== step.id;
          return (
            <button
              key={step.id}
              type="button"
              disabled={checked}
              onClick={() => pick(step.id)}
              aria-pressed={picked}
              // The same size, padding (the border's width is made up from `OPTION.padX`: a 1px line at rest, a 2px border picked), corners and text as every other option of the module.
              style={{ height: OPTION.height, borderRadius: OPTION.radius, paddingInline: picked ? OPTION.padX - 2 : OPTION.padX - 1, fontSize: OPTION.font }}
              className={`relative flex cursor-pointer items-center justify-center text-center leading-5 font-medium text-[#444444] dark:text-white ${RAISED} ${
                misplaced
                  ? `${EDGE.red} border-2 border-[#E5484D] bg-[#FFF1F1] dark:bg-[#2A1517]`
                  : picked
                    ? `${EDGE.green} border-2 border-[#01A17F] bg-[#F2FBF8] dark:bg-[#0F2921]`
                    : `${EDGE.khaki} border ${IDLE_LOOK}`
              }`}
            >
              {picked && (
                <span
                  aria-hidden
                  className={`absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full border-2 border-white text-[13px] leading-none font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] dark:border-[#15181E] ${misplaced ? "bg-[#E5484D]" : "bg-[#01A17F]"}`}
                >
                  {place + 1}
                </span>
              )}
              {step.text}
            </button>
          );
        })}
      </motion.div>
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
