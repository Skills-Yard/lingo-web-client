"use client";

import { useEffect, useRef } from "react";
import type { OnboardingListOption } from "@/lib/constants/onboarding";
import { motion } from "framer-motion";
import { optionDropIn, squeezedSpace } from "./optionCard";
import { QuestionGridOptions } from "./QuestionGridScreen";

interface QuestionListOptionsProps {
  options: OnboardingListOption[];
  /** "tiles": the picture-card grid (see QuestionGridOptions) instead of rows. */
  variant?: "tiles";
  /** More room between the cards, and between them and the heading. */
  roomy?: boolean;
  selectedId: string | null;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption: number;
  onPick: (id: string) => void;
  /** Shorter tiles, for the day/night question. */
  compact?: boolean;
  /** The screen is being left: options float back down and out. */
  leaving?: boolean;
  /** Seconds to hold the options before they leave. */
  leaveDelay?: number;
}

/**
 * The row card: a 58px white face (8px top corners, 4px bottom) sitting on a
 * 6px khaki edge — drawn as a hard shadow, so it takes no layout space and a
 * press sinks the face onto it. Selected (or read out) turns the edge and
 * stroke green.
 */
const rowCardClass = (selected: boolean, spotlight: boolean) => {
  const lit = selected || spotlight;
  return `rounded-t-[8px] rounded-b-[4px] border transition-[scale,translate,box-shadow,background-color,border-color] duration-200 ease-out active:translate-y-[3px] ${
    spotlight ? "scale-[1.04]" : ""
  } ${
    lit
      ? `border-primary bg-[#F2FBF8] shadow-[0_6px_0_#008566] active:shadow-[0_3px_0_#008566] dark:bg-[#0F2921]`
      : `border-black/4 bg-white shadow-[0_6px_0_#BDBA99,1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] active:shadow-[0_3px_0_#BDBA99] dark:border-white/6 dark:bg-[#15181E] dark:shadow-[0_6px_0_#2A2E37] dark:active:shadow-[0_3px_0_#2A2E37]`
  }`;
};

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
  roomy,
  selectedId,
  spokenOption,
  onPick,
  compact,
  leaving,
  leaveDelay,
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
        leaving={leaving}
        leaveDelay={leaveDelay}
      />
    );
  }

  // Each row is 58px plus the 6px under it for its edge. On a short phone the
  // gaps and the padding shrink (never the rows) before the list scrolls.
  const space = squeezedSpace(options.length * 64, {
    top: { max: roomy ? 40 : 24, min: 6 },
    gap: { max: roomy ? 18 : 12, min: 6, count: options.length - 1 },
    bottom: { max: 8, min: 3 },
  });

  return (
    // The outer box takes the room the screen leaves and measures it, so the
    // list's spacing can follow it (see `squeezedSpace`). Options keep their
    // natural height; if they still don't fit, only this section scrolls
    // (scrollbar hidden) — the CTA below is `shrink-0`, so it always stays
    // fully on screen.
    <div className="-mx-2.5 -mt-4 flex min-h-0 flex-1 flex-col [container-type:size] sm:-mt-3">
    <div
      ref={optionsRef}
      style={space as React.CSSProperties}
      className={`scrollbar-none flex h-full min-h-0 flex-col overflow-y-auto px-3 pb-2 max-sm:gap-(--sq-gap) max-sm:pt-(--sq-top) max-sm:pb-(--sq-bottom) ${
        roomy ? "gap-[18px] pt-10 sm:gap-5" : "gap-3 pt-6 sm:gap-3.5"
      }`}
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
            {...optionDropIn(selected, leaving, leaveDelay)}
            className={`mb-1.5 flex h-[58px] w-full shrink-0 items-center gap-4 px-4 py-2.5 text-left ${rowCardClass(selected, spotlight)}`}
          >
            {option.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={option.image}
                alt=""
                draggable={false}
                className="h-[37px] w-11 shrink-0 object-contain"
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
            <span className="text-[16px] leading-none font-medium text-[#444444] dark:text-white">
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
    </div>
  );
}
