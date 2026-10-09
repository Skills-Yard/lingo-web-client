"use client";

import { useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import type { OnboardingListOption } from "@/lib/constants/onboarding";
import { optionCardClass } from "./optionCard";

const poppins = Poppins({ subsets: ["latin"], weight: "500" });

interface QuestionListOptionsProps {
  options: OnboardingListOption[];
  /** "tiles": a 3-column grid of icon-over-label tiles instead of rows. */
  variant?: "tiles";
  selectedId: string | null;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption: number;
  onPick: (id: string) => void;
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

  if (variant === "tiles") {
    const lone = options.length % 3 === 1;
    return (
      // Figma "Frame 181": 358px wide, 108x118 tiles with 9px of space
      // between, 18px between rows, a lone last tile spanning the row.
      <div
        ref={optionsRef}
        className="scrollbar-none mx-auto mt-5 grid w-full max-w-[358px] min-h-0 flex-1 grid-cols-[repeat(3,108px)] auto-rows-max content-start justify-between gap-y-[18px] overflow-y-auto px-0 pt-1 pb-3"
      >
        {options.map((option, i) => {
          const selected = option.id === selectedId;
          const spotlight = !selected && i === spokenOption;
          const wide = lone && i === options.length - 1;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPick(option.id)}
              className={`${poppins.className} flex h-[118px] flex-col items-center justify-center gap-[5px] rounded-[8px] border-[3px] px-2 py-2 text-center transition-[box-shadow,border-color,scale] duration-200 active:scale-[0.97] dark:bg-[#15181E] ${
                wide ? "col-span-3" : ""
              } ${
                selected || spotlight
                  ? "border-primary bg-[#F7F8FA] shadow-[1px_1px_9.4px_rgba(0,184,169,0.7)]"
                  : "border-white bg-[#F7F8FA] shadow-[1px_1px_9.4px_rgba(0,0,0,0.16)] dark:border-white/10"
              }`}
            >
              {option.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.image}
                  alt=""
                  draggable={false}
                  className="h-[55px] w-[54px] shrink-0 object-contain"
                />
              )}
              <span className="text-balance text-[14px] font-medium leading-[1.28] text-[#1A1C22] dark:text-white">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    // Options keep their natural height; if they don't all fit, only this
    // section scrolls (scrollbar hidden) — the CTA below is `shrink-0`, so it
    // always stays fully on screen.
    <div
      ref={optionsRef}
      className="scrollbar-none mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto -mx-2.5 px-3 pt-1 pb-2 sm:mt-3 sm:gap-3.5"
    >
      {options.map((option, i) => {
        const selected = option.id === selectedId;
        const spotlight = !selected && i === spokenOption;
        const lit = selected || spotlight;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
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
          </button>
        );
      })}
    </div>
  );
}
