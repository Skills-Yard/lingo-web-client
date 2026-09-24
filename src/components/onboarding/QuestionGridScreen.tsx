"use client";

import { useEffect, useRef } from "react";
import { BookOpen, Smartphone, BarChart3, Trophy, type LucideIcon } from "lucide-react";
import type { OnboardingGridOption, TextSpan } from "@/lib/constants/onboarding";
import { QuestionHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { optionCardClass } from "./optionCard";

// The reference design reuses the same 4 illustrations for both grid
// questions (experience level, Python level) — see OnboardingGridOption's
// own doc comment. No matching custom illustration assets exist in this
// repo, so each slot is approximated as a big icon on a soft-tinted card
// rather than the reference's own bespoke artwork.
const ILLUSTRATIONS: Record<OnboardingGridOption["illustration"], { icon: LucideIcon; bg: string; fg: string }> = {
  books: { icon: BookOpen, bg: "bg-[#EAF7EC]", fg: "text-[#2FA84F]" },
  mobile: { icon: Smartphone, bg: "bg-[#EFEAFB]", fg: "text-[#7C5CE0]" },
  chart: { icon: BarChart3, bg: "bg-[#E8F1FB]", fg: "text-[#3B82C4]" },
  trophy: { icon: Trophy, bg: "bg-[#FDF3E0]", fg: "text-[#D69A1F]" },
};

interface QuestionGridScreenProps {
  heading: TextSpan[];
  options: OnboardingGridOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Question (then options) voiceover, played as the screen appears. */
  voiceover?: readonly string[];
  muted?: boolean;
  className?: string;
}

/**
 * A single-select question, options laid out as a 2x2 grid of illustrated
 * cards (experience level, Python level) — see QuestionListScreen for the
 * other question shape this flow uses (career/motivation, a vertical list).
 */
export function QuestionGridScreen({
  heading,
  options,
  selectedId,
  onSelect,
  voiceover,
  muted = false,
  className,
}: QuestionGridScreenProps) {
  // The fox beside the question talks exactly while its voice plays; the
  // question fills in as it's read, then each option lights up (selected look
  // + slight scale-up, never actually selected) as it's read out.
  const voice = useVoiceover(voiceover, true, muted);
  const spokenQuestion = questionSpoken(voice, !!voiceover?.length);
  const spokenOption = spokenOptionIndex(voice, options.length);

  // If the options scroll (short phones), keep the one being read in view.
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (spokenOption < 0) return;
    optionsRef.current?.children[spokenOption]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [spokenOption]);

  return (
    <div className={`flex flex-1 flex-col min-h-0 bg-white px-4 ${className ?? ""}`}>
      <QuestionHeading heading={heading} spoken={spokenQuestion} talking={voice.playing} />

      <div ref={optionsRef} className="scrollbar-none mt-4 grid min-h-0 flex-1 grid-cols-2 content-start gap-x-4 gap-y-5 overflow-y-auto -mx-2.5 px-3 pt-1.5 pb-3 sm:mt-5">
        {options.map((option, i) => {
          const selected = option.id === selectedId;
          const spotlight = !selected && i === spokenOption;
          const { icon: Icon, bg, fg } = ILLUSTRATIONS[option.illustration];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelect(option.id);
              }}
              className={`flex flex-col items-center gap-2 p-3 text-center ${optionCardClass(selected, spotlight)}`}
            >
              <span className={`flex h-16 w-full items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-7 w-7 ${fg}`} />
              </span>
              <span className="text-xs font-medium text-[#1A1C22] sm:text-sm">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
