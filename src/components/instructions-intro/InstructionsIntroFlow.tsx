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
  const [checked, setChecked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const triggerSound = useSound(true);

  const total = INSTRUCTIONS_INTRO_SLIDES.length;
  const slide = INSTRUCTIONS_INTRO_SLIDES[index];
  const stepNumber = index + 1;

  const goNext = () => {
    setSelected(null);
    setChecked(false);
    if (index >= total - 1) {
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (index === 0) return;
    setSelected(null);
    setChecked(false);
    setIndex((i) => i - 1);
  };

  const isQuiz = slide.kind === "teacher-quiz";
  const selectedOption =
    isQuiz && selected !== null ? slide.options[selected] : null;
  const isCorrect = !!selectedOption?.isCorrect;

  const handleSelect = (idx: number) => {
    triggerSound("tap");
    setSelected(idx);
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
    goNext();
  };

  const primaryLabel =
    slide.kind === "teacher-quiz" && !checked
      ? slide.submitLabel
      : isQuiz && checked && !isCorrect
        ? "Try Again"
        : slide.cta;

  const primaryState: PrimaryState =
    isQuiz && !checked && selected === null
      ? "disabled"
      : isQuiz && checked && !isCorrect
        ? "retry"
        : "go";

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
          </div>
        </div>

        {/* ── Footer — shrink-0, in normal flow, so it can never overlap scrollable content above it ── */}
        <IntroFooter
          primaryLabel={primaryLabel}
          primaryState={primaryState}
          onPrimaryAction={handlePrimaryAction}
          feedback={feedback}
          ctaFullWidth={slide.kind !== "teacher-intro"}
        />
      </div>
    </main>
  );
}
