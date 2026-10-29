"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { vibrateForAnswer } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { AnswerCards, answerCardsStack } from "./AnswerCards";
import { HexBubble } from "./HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "./LevelTwoShell";
import { RobotBackdrop, robotAbove } from "./RobotBackdrop";
import { TileCards, tileCardsStack } from "./TileCards";
import { levelTwoHref, type Quiz } from "./levelTwo";

/**
 * A Module 2 question: the title, Hex asking it, and the answers (rows, two
 * cards or three tiles). Like Level 1's quizzes, the main button checks the
 * pick (right is green, a miss red, the result panel slides up) and then moves
 * on. The robot behind it reacts: a miss plays `quiz.wrongMove`, and a right
 * answer can also place the cube in the target (`quiz.placesCube`).
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
    vibrateForAnswer(correct);
    setAnswer((previous) => ({ id: (previous?.id ?? 0) + 1, correct }));
    if (!correct) fireRobot(quiz.wrongMove ?? "wrongClaw");
    else if (quiz.placesCube) fireRobot("placeInTarget");
  };

  return (
    <LevelTwoShell
      step={step}
      scene={
        <RobotBackdrop
          bottom={robotAbove(quiz.layout === "list" ? answerCardsStack(quiz.choices.length) : tileCardsStack(quiz.layout), quiz.hint)}
          pose={quiz.pose}
          hint={!!quiz.targetHint && hinted && !checked}
        />
      }
      answer={answer}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : (quiz.ctaLabel ?? "Check")}
      hint={quiz.hint ? { visible: true, onUse: () => setHinted(true) } : undefined}
      onContinue={() => (checked ? router.push(levelTwoHref(step + 1)) : check())}
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
