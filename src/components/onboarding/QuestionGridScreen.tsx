"use client";

import { BookOpen, Smartphone, BarChart3, Trophy, type LucideIcon } from "lucide-react";
import type { OnboardingGridOption, TextSpan } from "@/lib/constants/onboarding";
import { Button3D } from "@/components/ui/Button3D";
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
  cta: string;
  onContinue: () => void;
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
  cta,
  onContinue,
  voiceover,
  muted = false,
  className,
}: QuestionGridScreenProps) {
  useVoiceover(voiceover, true, muted);

  return (
    <div className={`flex flex-1 flex-col min-h-0 bg-white px-4 ${className ?? ""}`}>
      <div className="flex shrink-0 items-start gap-3 pt-1">
        <div aria-hidden className="relative shrink-0">
          <img src="/images/quesfoxi.png" alt="" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
        </div>
        <h1 className="pt-1 text-lg font-semibold leading-snug text-[#1A1C22] sm:text-xl">
          {heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
              {span.text}
            </span>
          ))}
        </h1>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 content-start gap-x-4 gap-y-5 overflow-y-auto px-0.5 pb-3 sm:mt-5">
        {options.map((option) => {
          const selected = option.id === selectedId;
          const { icon: Icon, bg, fg } = ILLUSTRATIONS[option.illustration];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelect(option.id);
              }}
              className={`flex flex-col items-center gap-2 p-3 text-center ${optionCardClass(selected)}`}
            >
              <span className={`flex h-[min(4rem,9dvh)] w-full items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-7 w-7 ${fg}`} />
              </span>
              <span className="text-xs font-medium text-[#1A1C22] sm:text-sm">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-full shrink-0 pb-4 pt-2 sm:pb-6">
        <Button3D
          onClick={onContinue}
          onPress={playClickSound}
          disabled={!selectedId}
          className="w-full"
        >
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
