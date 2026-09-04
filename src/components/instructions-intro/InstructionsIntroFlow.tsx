"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { INSTRUCTIONS_INTRO_SLIDES } from "@/lib/constants/instructionsIntro";
import { useSound } from "@/hooks/useSound";
import { IntroHeader } from "./IntroHeader";
import { IntroFooter, type PrimaryState } from "./IntroFooter";
import { CoverScreen } from "./CoverScreen";
import { TeacherIntroScreen } from "./TeacherIntroScreen";
import { TeacherQuizScreen } from "./TeacherQuizScreen";
import { ExamplesGridScreen } from "./ExamplesGridScreen";
import { VideoScreen } from "./VideoScreen";
import { QuestionnaireScreen } from "./QuestionnaireScreen";
import { RewardScreen } from "./RewardScreen";
import { GameBoardScreen } from "./GameBoardScreen";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

interface InstructionsIntroFlowProps {
  onComplete?: () => void;
  initialIndex?: number;
}

export function InstructionsIntroFlow({
  onComplete,
  initialIndex = 0,
}: InstructionsIntroFlowProps) {
  const [index, setIndex] = useState(initialIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [gameSolved, setGameSolved] = useState(false);
  const triggerSound = useSound(true);

  const total = INSTRUCTIONS_INTRO_SLIDES.length;
  const slide = INSTRUCTIONS_INTRO_SLIDES[index];
  const stepNumber = index + 1;

  const goNext = () => {
    setSelected(null);
    setSelectedQuestionnaireId(null);
    setRewardClaimed(false);
    setChecked(false);
    setGameSolved(false);
    if (index >= total - 1) {
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (index === 0) return;
    setSelected(null);
    setSelectedQuestionnaireId(null);
    setChecked(false);
    setGameSolved(false);
    setIndex((i) => i - 1);
  };

  const isQuiz = slide.kind === "teacher-quiz";
  const isQuestionnaire = slide.kind === "questionnaire";
  
  const selectedOption =
    isQuiz && selected !== null ? slide.options[selected] : null;
  const isCorrect = !!selectedOption?.isCorrect;

  // For questionnaire: find the selected item and check if it's correct
  let selectedQuestionnaireItem = null;
  let questionnaireIsCorrect = false;
  if (isQuestionnaire && selectedQuestionnaireId) {
    selectedQuestionnaireItem = slide.items.find(item => item.id === selectedQuestionnaireId);
    questionnaireIsCorrect = !!selectedQuestionnaireItem?.isCorrect;
  }

  const handleSelect = (idx: number) => {
    triggerSound("tap");
    setSelected(idx);
  };

  const handleQuestionnaireSelect = (id: string) => {
    triggerSound("tap");
    setSelectedQuestionnaireId(id);
  };

  const handlePrimaryAction = () => {
    if (isQuiz && !checked) {
      if (selected === null) return;
      setChecked(true);
      triggerSound(isCorrect ? "win" : "lose");
      return;
    }
    if (isQuiz && checked && !isCorrect) {
      // Wrong answer: let the learner try again instead of moving on.
      setSelected(null);
      setChecked(false);
      return;
    }
    if (isQuestionnaire && !checked) {
      if (selectedQuestionnaireId === null) return;
      setChecked(true);
      triggerSound(questionnaireIsCorrect ? "win" : "lose");
      return;
    }
    if (isQuestionnaire && checked && !questionnaireIsCorrect) {
      // Wrong answer: let them try again
      setSelectedQuestionnaireId(null);
      setChecked(false);
      return;
    }
    goNext();
  };

  const primaryLabel =
    (slide.kind === "teacher-quiz" || slide.kind === "questionnaire") && !checked
      ? slide.kind === "teacher-quiz" ? slide.submitLabel : "Check Answer"
      : (isQuiz || isQuestionnaire) && checked && !(isCorrect || questionnaireIsCorrect)
        ? "Try Again"
        : slide.cta;

  const primaryState: PrimaryState =
    slide.kind === "game" && !gameSolved
      ? "disabled"
      : isQuiz && !checked && selected === null
        ? "disabled"
        : isQuestionnaire && !checked && selectedQuestionnaireId === null
          ? "disabled"
          : isQuiz && checked && !isCorrect
            ? "retry"
            : isQuestionnaire && checked && !questionnaireIsCorrect
              ? "retry"
              : "go";

  // The questionnaire's "Claim Reward" CTA gets the dark tone + gift icon (see command9).
  const isRewardCta =
    isQuestionnaire && checked && questionnaireIsCorrect;

  const feedback =
    slide.kind === "teacher-quiz" && checked && selectedOption
      ? {
          isCorrect,
          title: isCorrect ? slide.correctTitle : slide.incorrectTitle,
          body: isCorrect ? slide.correctText : slide.incorrectText,
        }
      : null;

  return (
    <main
      className={`${poppins.className} h-screen w-full max-w-full overflow-hidden bg-background dark:bg-[#0D1016] text-foreground flex flex-col items-center transition-colors duration-200`}
    >
      <div className="w-full max-w-md md:max-w-7xl flex flex-col h-full">
        {/* ── Header (same on every slide) — fixed height, never scrolls or gets covered ── */}
        <IntroHeader
          stepNumber={stepNumber}
          stepTotal={total}
          bookmarked={bookmarked}
          onBack={goBack}
          onToggleBookmark={() => setBookmarked((b) => !b)}
        />

        {/* ── Body — the only part that scrolls, so header/footer are always fully visible ── */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 md:px-10 scrollbar-none"
          style={{ msOverflowStyle: "none" }}
        >
          <div className="flex flex-col gap-3 select-none min-h-full pb-3 md:pb-0 md:justify-center">
            {slide.kind === "cover" && <CoverScreen slide={slide} />}
            {slide.kind === "teacher-intro" && <TeacherIntroScreen slide={slide} />}
            {slide.kind === "teacher-quiz" && (
              <TeacherQuizScreen
                slide={slide}
                selected={selected}
                checked={checked}
                onSelect={handleSelect}
              />
            )}
            {slide.kind === "examples-grid" && <ExamplesGridScreen slide={slide} />}
            {slide.kind === "video" && <VideoScreen slide={slide} />}
            {slide.kind === "questionnaire" && (
              <QuestionnaireScreen 
                slide={slide} 
                selectedId={selectedQuestionnaireId}
                checked={checked}
                onSelect={handleQuestionnaireSelect} 
              />
            )}
            {slide.kind === "reward" && (
              <RewardScreen 
                slide={slide} 
                onClaim={() => console.log("Reward claimed")}
                onClaimStateChange={setRewardClaimed}
              />
            )}
            {slide.kind === "game" && (
              <GameBoardScreen slide={slide} onSolvedChange={setGameSolved} />
            )}
          </div>
        </div>

        {/* ── Footer — shrink-0, in normal flow, so it can never overlap scrollable content above it ── */}
        {!(slide.kind === "reward" && !rewardClaimed) && (
          <IntroFooter
            primaryLabel={primaryLabel}
            primaryState={primaryState}
            onPrimaryAction={handlePrimaryAction}
            feedback={feedback}
            ctaFullWidth={slide.kind !== "teacher-intro"}
            primaryTone={isRewardCta ? "dark" : "brand"}
            leadingIcon={
              isRewardCta ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/clam-box.png" alt="" className="w-6 h-6 object-contain" />
              ) : undefined
            }
          />
        )}
      </div>
    </main>
  );
}
