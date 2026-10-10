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
      // Figma "Frame 181": 358px wide, rows of three 108x118 tiles
      // (space-between, 9px minimum — 17px at full width) with 24px between
      // rows; a lone last tile spans the row.
      <div
        ref={optionsRef}
        className="scrollbar-none mx-auto mt-5 grid w-full max-w-[358px] min-h-0 flex-1 grid-cols-[repeat(3,108px)] auto-rows-max content-start justify-between gap-x-[9px] gap-y-[24px] overflow-y-auto px-0 pt-1 pb-3"
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
              // Figma "Frame 128": 108x118, 18px padding, 5px gap, #F7F8FA
              // with a 6px khaki bottom edge. Selected swaps the edge for
              // the brand colour and adds a 3px ring (box-shadow, so the
              // content never shifts). The wide tile has a 4px gap; a
              // `compact` tile (one-line label, e.g. DevOps) is 8px/18px
              // padded and top-aligned.
              className={`${poppins.className} box-border flex h-[118px] flex-col items-center rounded-[8px] border-0 border-b-[6px] bg-[#F7F8FA] text-center transition-[box-shadow,border-color,scale] duration-200 active:scale-[0.97] dark:bg-[#15181E] ${
                wide ? "col-span-3 justify-center gap-1 p-[18px]" : ""
              } ${
                option.compact
                  ? "justify-start gap-[5px] px-[18px] py-2"
                  : wide
                    ? ""
                    : "justify-center gap-[5px] p-[18px]"
              } ${
                selected || spotlight
                  ? "border-b-primary shadow-[0_0_0_3px_var(--color-primary),1px_1px_9.4px_rgba(0,184,169,0.7)]"
                  : "border-b-[#BDBA99] shadow-[1px_1px_9.4px_rgba(0,0,0,0.16)] dark:border-b-[#2A2E37]"
              }`}
            >
              {option.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.image}
                  alt=""
                  draggable={false}
                  className={`shrink-0 object-contain ${
                    wide
                      ? "h-[51px] w-[51px]"
                      : option.compact
                        ? "h-[54px] w-[53px]"
                        : "h-[55px] w-[54px]"
                  }`}
                />
              )}
              <span
                className={`self-stretch text-balance text-[14px] font-medium dark:text-white ${
                  option.compact
                    ? "leading-[1.24] text-[#2C2C2C]"
                    : "leading-[1.28] text-[#1A1C22]"
                }`}
              >
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
