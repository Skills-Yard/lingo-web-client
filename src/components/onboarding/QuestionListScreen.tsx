"use client";

import { useEffect, useRef } from "react";
import type { OnboardingListOption, TextSpan } from "@/lib/constants/onboarding";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { optionCardClass } from "./optionCard";
import { QuestionHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";

interface QuestionListScreenProps {
  heading: TextSpan[];
  options: OnboardingListOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
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
  voiceover,
  muted = false,
  className,
}: QuestionListScreenProps) {
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

      {/* Options keep their natural height; if they don't all fit, only
          this section scrolls (scrollbar hidden) — the CTA below is
          `shrink-0`, so it always stays fully on screen. */}
      <div ref={optionsRef} className="scrollbar-none mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto -mx-2.5 px-3 pt-1.5 pb-3 sm:mt-5 sm:gap-[1.125rem]">
        {options.map((option, i) => {
          const selected = option.id === selectedId;
          const spotlight = !selected && i === spokenOption;
          const lit = selected || spotlight;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelect(option.id);
              }}
              className={`flex min-h-14 w-full shrink-0 items-center gap-3 px-4 py-2 text-left ${optionCardClass(selected, spotlight)}`}
            >
              {option.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.image}
                  alt=""
                  draggable={false}
                  className="h-11 w-11 shrink-0 object-contain"
                />
              ) : (
                Icon && (
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      lit ? "bg-primary text-white" : "bg-[#D9F6EC] text-[#1A1C22]"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                )
              )}
              <span className="text-sm font-medium text-[#1A1C22] sm:text-base">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
