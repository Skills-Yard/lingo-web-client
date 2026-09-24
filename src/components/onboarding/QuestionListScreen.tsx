"use client";

import type { OnboardingListOption, TextSpan } from "@/lib/constants/onboarding";
import { Button3D } from "@/components/ui/Button3D";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { optionCardClass } from "./optionCard";
import { OnboardingFox } from "./robu/OnboardingFox";

interface QuestionListScreenProps {
  heading: TextSpan[];
  options: OnboardingListOption[];
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
 * A single-select question, options laid out as a vertical list of cards
 * (career, motivation) — see QuestionGridScreen for the other question
 * shape this flow uses (experience/Python level, a 2x2 illustrated grid).
 */
export function QuestionListScreen({
  heading,
  options,
  selectedId,
  onSelect,
  cta,
  onContinue,
  voiceover,
  muted = false,
  className,
}: QuestionListScreenProps) {
  useVoiceover(voiceover, true, muted);

  return (
    <div className={`flex flex-1 flex-col min-h-0 bg-white px-4 ${className ?? ""}`}>
      <div className="flex shrink-0 items-center gap-1 pt-1">
        <div aria-hidden className="relative shrink-0 mr-2">
          <img src="/images/quesfoxi.png" alt="" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
        </div>
        <h1 className="text-lg font-semibold leading-snug text-[#1A1C22] sm:text-xl">
          {heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
              {span.text}
            </span>
          ))}
        </h1>
      </div>

      {/* Options share the leftover height (each capped at its natural
          size), so all six shrink to fit a short phone instead of pushing
          the CTA off-screen. `overflow-y-auto` is only a last resort for
          e.g. a phone in landscape. */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-0.5 pb-3 sm:mt-5 sm:gap-[1.125rem]">
        {options.map((option) => {
          const selected = option.id === selectedId;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelect(option.id);
              }}
              className={`flex max-h-16 min-h-11 w-full flex-1 shrink-0 basis-0 items-center gap-3 px-4 text-left ${optionCardClass(selected)}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  selected ? "bg-primary text-white" : "bg-[#D9F6EC] text-[#1A1C22]"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-[#1A1C22] sm:text-base">
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
