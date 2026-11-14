"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CircleAlert } from "lucide-react";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import { HexBubble } from "@/components/level-two/HexBubble";
import { LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { ArrangeBoard, ArrangeDock, arrangeGeometry, useArrange, type ArrangeCardDef } from "@/components/sequence/ArrangeBoard";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { HEX_ROW_TOP } from "./scenes";
import { useBubbleSize } from "./bubbleWidth";
import { OPTION, parseTitle } from "./quiz";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";
import { noteAnswer, noteStruggle } from "./variableScore";

const TITLE = parseTitle("Plan the *App's Steps*");

/** The steps, listed out of order, so the list doesn't give the plan away. They look like every other option of the module: white, with its thin grey line. */
const STEP_TINT = "bg-white dark:bg-[#15181E]";
const STEPS: readonly ArrangeCardDef[] = [
  { id: "add", kind: "add", text: "Add both numbers.", tint: STEP_TINT },
  { id: "ask-first", kind: "ask-first", text: "Ask for the first number.", tint: STEP_TINT },
  { id: "keep-second", kind: "keep-second", text: "Keep the second number.", tint: STEP_TINT },
  { id: "show", kind: "show", text: "Display the result.", tint: STEP_TINT },
  { id: "ask-second", kind: "ask-second", text: "Ask for the second number.", tint: STEP_TINT },
  { id: "keep-first", kind: "keep-first", text: "Keep the first number.", tint: STEP_TINT },
];
/** The right order, first step first. */
const ANSWER = ["ask-first", "keep-first", "ask-second", "keep-second", "add", "show"];
/** What the alert says when a step that is not the right one for the number that is next is chosen, for each number (a reason, not the answer). */
const WRONG_STEP = [
  "Not yet. The app can't use a number before it asks for one.",
  "Not yet. Keep the number the app just asked for.",
  "Not yet. Now the app needs its second number.",
  "Not yet. Keep the second number too.",
  "Not yet. The app can only add once it has both numbers.",
  "Not yet. The result is shown last, after the adding.",
] as const;

/**
 * Two columns, 340 wide: the steps on the left, as wide as the room allows (282 × the module's one option height, 56,
 * 12px between rows), and a numbered circle for each place in the plan on the right (44 across, 14px from the steps,
 * each centred on its row). The steps never leave their rows and cannot be dragged: a step is given a number by tapping
 * it (see `ArrangeBoard`'s `circles` and `tapOnly`). Text, corners and line as the module's answer buttons.
 */
const GEO = arrangeGeometry({
  mode: "columns",
  card: { width: 282, height: OPTION.height },
  circles: 44,
  count: STEPS.length,
  gap: 12,
  lane: 14,
  line: "border-2 border-[#D2D8DE] dark:border-white/20",
  radius: OPTION.radius,
  sink: true,
  fontSize: OPTION.font,
});
/** The board starts 12px under Hex's bubble (which ends at y 214). */
const BOARD_TOP = 226;
/** Once the plan is done the board rises this far (px), so its last row ends clear above the result panel (y 600). */
const BOARD_RISE = 40;
/** The line under the board, and the room it takes. */
const NOTE_GAP = 10;
/** A step chosen wrongly shows red (and shakes) this long (ms); the alert stays this long (ms). */
const WRONG_MS = 900;
const ALERT_MS = 3400;
/** What Hex says, in a bubble wide enough to hold it in two lines (see `useBubbleSize`). */
const HEX_LINE = "Pick the steps in order, one at a time.";

/**
 * "Plan the App's Steps": the six steps of the addition application, to be numbered in the order the app does them
 * (ask, keep, ask, keep, add, display), one number at a time. The steps stand in a column on the left and the numbers 1
 * to 6 are circles on the right, only the next one open (the others dimmed). The learner taps a step (there is no
 * dragging): a right step is given the number (the circle and the step turn green, the step shows its number, and it is
 * locked); a wrong one is refused, with an alert saying why not yet (the step shakes red, the progress bar reacts, and it
 * counts as a miss), so the next number can only be chosen once the one before is right. The steps are pressed like the
 * module's buttons (3D). A step that is rightly matched bounces at once, with a shine and stars, and it and its number
 * are done with (neither can be pressed again); with the sixth step in, the plan is right. This is the point where the
 * learner sees why the app has to keep the two numbers.
 */
export function PlanAppScreen() {
  const router = useRouter();
  const { slots, placeIn } = useArrange(STEPS.map((step) => step.id), GEO.count);
  // The alert (what to tell the learner) and the step that was chosen wrongly, for a moment.
  const [alert, setAlert] = useState<{ text: string; key: number } | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const timers = useRef<{ alert?: number; wrong?: number }>({});
  // The hint: the pointing hand shows the right step, and the step takes a pale orange tint and one shine while the hand is on it (it does not float). The same hint every question of the app gives (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  const bubble = useBubbleSize(HEX_LINE);
  // Steps are only given numbers in order, so the numbers given are the first `done` ones.
  const given = slots.filter((id): id is string => id !== null);
  const done = given.length;
  const complete = done === STEPS.length;

  useEffect(
    () => () => {
      window.clearTimeout(timers.current.alert);
      window.clearTimeout(timers.current.wrong);
    },
    [],
  );

  /** The hint button: the pointing hand shows the right step for the number that is next. It counts as a hint for the screen's score. */
  const showHint = () => {
    if (complete) return;
    noteStruggle(STEP.plan, "hint");
    window.clearTimeout(timers.current.alert);
    setAlert(null);
    answerHint.press(ANSWER[done]);
  };

  /** Tells the learner a step is not the one for the number that is next: the step shakes red, the alert says why not yet, and it counts as a miss. */
  const refuse = (id: string) => {
    window.clearTimeout(timers.current.alert);
    window.clearTimeout(timers.current.wrong);
    setAlert({ text: WRONG_STEP[done], key: Date.now() });
    setWrongId(id);
    noteAnswer(STEP.plan, 0, false);
    noteStruggle(STEP.plan, "miss");
    vibrateForAnswer(false);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: false }));
    timers.current.wrong = window.setTimeout(() => setWrongId(null), WRONG_MS);
    timers.current.alert = window.setTimeout(() => setAlert(null), ALERT_MS);
  };

  /** A step is tapped: if it is the right one for the number that is next it is given the number, and it is locked; if not, it is refused. */
  const tapStep = (id: string) => {
    if (complete || given.includes(id)) return;
    // The learner acts: the hand goes and the step stops glowing.
    answerHint.stop();
    if (id !== ANSWER[done]) {
      playClickSound();
      return refuse(id);
    }
    window.clearTimeout(timers.current.alert);
    setAlert(null);
    placeIn(id, done);
    if (done === STEPS.length - 1) {
      // The sixth is in: the whole plan is right.
      noteAnswer(STEP.plan, 0, true);
      vibrateForAnswer(true);
      setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct: true }));
    }
  };

  return (
    <LevelTwoShell
      step={STEP.plan}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.plan))}
      scene={<SoftBackdrop />}
      answer={answer}
      ctaDisabled={!complete}
      ctaLabel={complete ? "Next" : "Continue"}
      // The hint button (until the plan is done): the pointing hand shows the right step.
      hint={{ visible: !complete, onUse: showHint }}
      onContinue={() => router.push(variableNext(STEP.plan))}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel correct title="Excellent!" open={complete} hexIn={complete} hexCue={complete ? HEX_ONBOARDING_TRIGGER.continueThumb : null} grouped>
            You planned the app&apos;s logic.
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
        <HexBubble entryKey="variable-plan" hex="left" line={[{ text: HEX_LINE }]} size={bubble} leaving={complete} />
      </div>
      {/* The steps (left) and their number circles (right), the next circle open. Once the plan is done the board rises to clear the result panel. */}
      <ArrangeDock geo={GEO} top={BOARD_TOP} rise={complete ? BOARD_RISE : 0}>
        <ArrangeBoard
          cards={STEPS}
          slots={slots}
          geo={GEO}
          disabled={false}
          // A step with its number cannot be moved; only the next circle is open.
          lockedIds={given}
          // The step the hand points at takes a tint and one shine while the hand is on it.
          pointedId={answerHint.pointedId}
          activeSlot={complete ? undefined : done}
          // Each step bounces (with its shine and stars, its shadow staying on the ground) the moment it is rightly matched to its number, since that is when the learner knows it is right. Nothing bounces together at the end.
          bouncedIds={given}
          wrongIds={wrongId ? [wrongId] : []}
          // The steps are tapped, not dragged.
          tapOnly
          onTap={tapStep}
        />
        {/* Under the board: which number is next, or, for a moment after a wrong step, the alert. */}
        {!complete && (
          <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top: GEO.board.height + NOTE_GAP }}>
            {alert ? (
              <motion.p
                key={alert.key}
                role="alert"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex max-w-[340px] items-start gap-2 rounded-[12px] border border-[#E5484D] bg-[#FFF1F1] px-3 py-2 text-[13px] leading-5 font-medium text-[#D42421]"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {alert.text}
              </motion.p>
            ) : (
              <p className="text-center text-[13px] leading-5 font-medium text-[#6B7480] dark:text-white/60">{`Which step is number ${done + 1}?`}</p>
            )}
          </div>
        )}
      </ArrangeDock>
      {/* The hint's hand: taps the right step; it goes as soon as the learner does something. */}
      {answerHint.hand}
      <Confetti active={complete} />
      <XpBurst show={complete} />
    </LevelTwoShell>
  );
}
