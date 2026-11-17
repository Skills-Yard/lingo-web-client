"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnswerHint } from "@/components/level-one/answerHint";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel, XpBurst } from "@/components/level-one/FeedbackPanel";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { noteAnswer, nextAfter } from "@/lib/moduleReview";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { AnswerCards } from "./AnswerCards";
import { HexBubble } from "./HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "./LevelTwoShell";
import { RobotBackdrop, robotBelowDialogue } from "./RobotBackdrop";
import { TileCards } from "./TileCards";
import { levelTwoHref, type Quiz } from "./levelTwo";

/**
 * A Module 2 question: the title, Hex asking it, and the answers (rows, two
 * cards or three tiles). Like Level 1's quizzes, the main button checks the
 * pick (right is green, a miss red, the result panel slides up) and then moves
 * on. The robot behind it reacts to the answer that was checked: it plays that
 * choice's `moves` (a wrong one with none plays the claw's), alongside the
 * result: nothing waits for the robot to finish.
 */
export function QuizScreen({ step, quiz }: { step: number; quiz: Quiz }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  // The hint: the hand that points at the right answer (see `useAnswerHint`).
  const answerHint = useAnswerHint();
  const correct = selectedId === quiz.correctId;
  const picked = quiz.choices.find((choice) => choice.id === selectedId);
  // A right answer that plays a robot move: the cards go clear so it can be seen.
  const fadeCards = checked && correct && !quiz.keepCards && !!picked?.moves?.length;
  // The target box is lit from the start (`targetLabel`) until the answer is checked.
  const targetLit = quiz.targetLabel !== undefined;

  // The learner picks an answer: the hint's hand goes.
  const pick = (id: string) => {
    answerHint.stop();
    setSelectedId(id);
  };

  const check = () => {
    answerHint.stop();
    setChecked(true);
    noteAnswer(step, correct);
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    // The hint's glow goes out first, then the robot plays what this answer does.
    if (targetLit) fireRobot("hideHint");
    (picked?.moves ?? (correct ? [] : ["wrongClaw"])).forEach((move) => fireRobot(move));
  };

  return (
    <LevelTwoShell
      step={step}
      scene={
        <RobotBackdrop
          below={robotBelowDialogue(quiz.bubbleTop, quiz.bubble)}
          pose={quiz.pose}
          hint={targetLit && !checked}
          targetLabel={quiz.targetLabel}
        />
      }
      answer={answer}
      voiceover={checked ? undefined : quiz.voiceover}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : (quiz.ctaLabel ?? "Check")}
      // Once the answer is checked the hint folds away and Continue takes its room.
      hint={{ visible: !checked, onUse: () => answerHint.press(quiz.correctId) }}
      onContinue={() => (checked ? router.push(nextAfter(step, correct, levelTwoHref(step + 1))) : check())}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            title={correct ? quiz.rightTitle : quiz.wrongTitle}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
            grouped
          >
            {correct ? quiz.right : quiz.wrong}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle oneLine={quiz.title.length === 1}>
        <TitleText lines={quiz.title} underline={quiz.underline} />
      </ScreenTitle>
      <CentredRow top={stageTop(quiz.bubbleTop)}>
        <HexBubble entryKey={`quiz-${step}`} hex="left" line={quiz.line} size={quiz.bubble} leaving={checked} />
      </CentredRow>
      {quiz.layout === "list" ? (
        <AnswerCards
          choices={quiz.choices}
          correctId={quiz.correctId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          pointedId={answerHint.pointedId}
          withHint
          onPick={pick}
        />
      ) : (
        <TileCards
          layout={quiz.layout}
          choices={quiz.choices}
          correctId={quiz.correctId}
          selectedId={selectedId}
          checked={checked}
          fadeOut={fadeCards}
          pointedId={answerHint.pointedId}
          withHint
          longText={quiz.longText}
          onPick={pick}
        />
      )}
      {/* The hint's hand: taps the right answer; it goes as soon as the learner does something. */}
      {answerHint.hand}
      <Confetti active={checked && correct} />
      <XpBurst show={checked && correct} />
    </LevelTwoShell>
  );
}
