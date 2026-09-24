"use client";

import { useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import { CircleX, Smartphone, BarChart3, Trophy, type LucideIcon } from "lucide-react";
import type { OnboardingGridOption, TextSpan } from "@/lib/constants/onboarding";
import { QuestionHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { optionCardClass } from "./optionCard";

// Grid options without their own `image` get an icon in the picture panel
// instead — no matching artwork exists for those yet ("No", and the later
// grid questions' options).
const ILLUSTRATIONS: Record<OnboardingGridOption["illustration"], { icon: LucideIcon; fg: string }> = {
  books: { icon: CircleX, fg: "text-[#2F6FE4]" },
  mobile: { icon: Smartphone, fg: "text-[#7C5CE0]" },
  chart: { icon: BarChart3, fg: "text-[#3B82C4]" },
  trophy: { icon: Trophy, fg: "text-[#D69A1F]" },
};

// The Figma label type: Poppins 500, 16px / 140%.
const poppins = Poppins({ subsets: ["latin"], weight: "500" });

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
          const { icon: Icon, fg } = ILLUSTRATIONS[option.illustration];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playClickSound();
                onSelect(option.id);
              }}
              // Figma "Group 94": a 169x189 tile — a light-blue 134px picture
              // panel over a white 55px label strip (the card's own khaki
              // bottom edge from optionCardClass underneath).
              className={`flex aspect-[169/189] flex-col overflow-hidden text-center ${optionCardClass(selected, spotlight)}`}
            >
              <span className="relative flex min-h-0 w-full flex-1 items-center justify-center bg-[#E5EFFD]">
                {option.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={option.image}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Icon className={`h-14 w-14 ${fg}`} strokeWidth={1.75} />
                )}
              </span>
              <span
                className={`${poppins.className} flex h-[55px] w-full shrink-0 items-center justify-center px-2.5 text-balance text-base font-medium leading-[1.4] text-[#2C2C2C]`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
