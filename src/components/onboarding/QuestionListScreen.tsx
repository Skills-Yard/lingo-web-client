"use client";

import { useEffect, useRef } from "react";
import type { OnboardingListOption } from "@/lib/constants/onboarding";
import { motion } from "framer-motion";
import { optionCardClass, optionDropIn } from "./optionCard";
import { QuestionGridOptions } from "./QuestionGridScreen";

interface QuestionListOptionsProps {
  options: OnboardingListOption[];
  /** "tiles": the picture-card grid (see QuestionGridOptions) instead of rows. */
  variant?: "tiles";
  selectedId: string | null;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption: number;
  onPick: (id: string) => void;
  /** Shorter tiles, for the day/night question. */
  compact?: boolean;
}

/**
 * The options of a single-select question laid out as a vertical list of
 * cards (career, motivation) — see QuestionGridOptions for the other shape
 * (experience/Python level, a 2x2 illustrated grid). The question row above
 * them (Zox + heading) belongs to QuestionScreen, so it stays put when the
 * next question's options replace these.
 */
export function QuestionListOptions({
  options,
  variant,
  selectedId,
  spokenOption,
  onPick,
  compact,
}: QuestionListOptionsProps) {
  // If the options scroll (short phones), keep the one being read in view.
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (spokenOption < 0) return;
    optionsRef.current?.children[spokenOption]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [spokenOption]);

  // The career question: the same illustrated 2-column cards as the other
  // picture questions (experience, Python level, time of day).
  if (variant === "tiles") {
    return (
      <QuestionGridOptions
        options={options.map(({ id, label, image }) => ({
          id,
          label,
          image,
          illustration: "books",
        }))}
        selectedId={selectedId}
        spokenOption={spokenOption}
        onPick={onPick}
        compact={compact}
      />
    );
  }

  return (
    // Options keep their natural height; if they don't all fit, only this
    // section scrolls (scrollbar hidden) — the CTA below is `shrink-0`, so it
    // always stays fully on screen.
    <div
      ref={optionsRef}
      className="scrollbar-none flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto -mx-2.5 px-3 pt-6 pb-2 -mt-4 sm:-mt-3 sm:gap-3.5"
    >
      {options.map((option, i) => {
        const selected = option.id === selectedId;
        const spotlight = !selected && i === spokenOption;
        const lit = selected || spotlight;
        const Icon = option.icon;
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            {...optionDropIn(i)}
            className={`flex min-h-12 w-full shrink-0 items-center gap-3 px-3.5 py-1.5 text-left ${optionCardClass(selected, spotlight)}`}
          >
            {option.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={option.image}
                alt=""
                draggable={false}
                className="h-9 w-9 shrink-0 object-contain"
              />
            ) : (
              Icon && (
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    lit
                      ? "bg-primary text-white"
                      : "bg-[#D9F6EC] text-[#1A1C22] dark:bg-[#0F2921] dark:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              )
            )}
            <span className="text-[16px] font-medium text-[#1A1C22] dark:text-white">
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
