"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
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
  const [hinted, setHinted] = useState(false);
  const correct = selectedId === quiz.correctId;

  const check = () => {
    setChecked(true);
    noteAnswer(step, correct);
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    // The hint's glow goes out first, then the robot plays what this answer does.
    if (quiz.targetHint && hinted) fireRobot("hideHint");
    const picked = quiz.choices.find((choice) => choice.id === selectedId);
    (picked?.moves ?? (correct ? [] : ["wrongClaw"])).forEach((move) => fireRobot(move));
  };

  return (
    <LevelTwoShell
      step={step}
      scene={
        <RobotBackdrop
          below={robotBelowDialogue(quiz.bubbleTop, quiz.bubble)}
          pose={quiz.pose}
          hint={!!quiz.targetHint && hinted && !checked}
        />
      }
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : (quiz.ctaLabel ?? "Check")}
      hint={quiz.hint ? { visible: true, onUse: () => setHinted(true) } : undefined}
      onContinue={() => (checked ? router.push(nextAfter(step, correct, levelTwoHref(step + 1))) : check())}
      overlay={
        <div className="pointer-events-none absolute inset-0">
          <FeedbackPanel
            correct={correct}
            open={checked}
            hexIn={checked}
            hexCue={correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null}
          >
            {correct ? quiz.right : quiz.wrong}
          </FeedbackPanel>
        </div>
      }
    >
      <ScreenTitle>
        <TitleText lines={quiz.title} underline={quiz.underline} />
      </ScreenTitle>
      <CentredRow top={stageTop(quiz.bubbleTop)}>
        <HexBubble entryKey={`quiz-${step}`} hex="right" line={quiz.line} size={quiz.bubble} />
      </CentredRow>
      {quiz.layout === "list" ? (
        <AnswerCards
          choices={quiz.choices}
          correctId={quiz.correctId}
          selectedId={selectedId}
          checked={checked}
          hinted={hinted}
          withHint={quiz.hint}
          onPick={setSelectedId}
        />
      ) : (
        <TileCards
          layout={quiz.layout}
          choices={quiz.choices}
          correctId={quiz.correctId}
          selectedId={selectedId}
          checked={checked}
          hinted={hinted}
          withHint={quiz.hint}
          longText={quiz.longText}
          onPick={setSelectedId}
        />
      )}
      <Confetti active={checked && correct} />
    </LevelTwoShell>
  );
}
