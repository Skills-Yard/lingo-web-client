"use client";

import { useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import { CircleX, Smartphone, BarChart3, Trophy, type LucideIcon } from "lucide-react";
import type { OnboardingGridOption } from "@/lib/constants/onboarding";
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

// Picture-panel tints, in the Figma option order (blue, peach, lilac, mint).
const PANEL_BG = ["#E5EFFD", "#FFF3DE", "#EFEAFC", "#ECF7ED"] as const;

// The Figma label type: Poppins 500, 16px / 140%.
const poppins = Poppins({ subsets: ["latin"], weight: "500" });

interface QuestionGridOptionsProps {
  options: OnboardingGridOption[];
  selectedId: string | null;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption: number;
  onPick: (id: string) => void;
}

/**
 * The options of a single-select question laid out as a 2x2 grid of
 * illustrated cards (experience level, Python level) — see QuestionListOptions
 * for the other shape (career/motivation, a vertical list). The question row
 * above them (Zox + heading) belongs to QuestionScreen.
 */
export function QuestionGridOptions({
  options,
  selectedId,
  spokenOption,
  onPick,
}: QuestionGridOptionsProps) {
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
    // `auto-rows-max` keeps each row the full tile height: on short screens
    // auto rows shrank below the (aspect-ratio'd) tiles, which then spilled
    // over the gap into the next row. Now the gap is always gap-y-3 and the
    // grid scrolls instead.
    <div ref={optionsRef} className="scrollbar-none mx-auto mt-4 grid w-full max-w-[306px] min-h-0 flex-1 grid-cols-[138px_138px] auto-rows-max content-start justify-between gap-y-[29px] overflow-y-auto px-0 pt-1 pb-2 sm:mt-5">
      {options.map((option, i) => {
        const selected = option.id === selectedId;
        const spotlight = !selected && i === spokenOption;
        const { icon: Icon, fg } = ILLUSTRATIONS[option.illustration];
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            // Figma "Group 94": a 169x189 tile — a light-blue 134px picture
            // panel over a white 55px label strip (the card's own khaki
            // bottom edge from optionCardClass underneath).
            className={`flex h-[150px] w-[138px] flex-col overflow-hidden text-center ${optionCardClass(selected, spotlight)}`}
          >
            <span
              className="relative flex min-h-0 w-full flex-1 items-center justify-center"
              style={{ background: PANEL_BG[i % PANEL_BG.length] }}
            >
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
              className={`${poppins.className} flex h-[43.65px] w-full shrink-0 items-center justify-center px-2 text-balance text-[14px] font-medium leading-[1.4] text-[#2C2C2C] dark:text-white`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
