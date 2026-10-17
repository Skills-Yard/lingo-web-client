"use client";

import { useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import { CircleX, Smartphone, BarChart3, Trophy, type LucideIcon } from "lucide-react";
import type { OnboardingGridOption } from "@/lib/constants/onboarding";
import { motion } from "framer-motion";
import { optionCardClass, optionDropIn } from "./optionCard";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

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

interface QuestionGridOptionsProps {
  options: OnboardingGridOption[];
  selectedId: string | null;
  /** Index of the option the voice is reading right now, or -1. */
  spokenOption: number;
  onPick: (id: string) => void;
  /** The day/night question's shorter 139x109 cards (Figma "Frame 211"). */
  compact?: boolean;
}

/**
 * The options of a single-select question laid out as a 2x2 grid of
 * illustrated cards (experience level, Python level) — see QuestionListOptions
 * for the other shape (career/motivation, a vertical list). The question row
 * above them (Zox + heading) belongs to QuestionScreen.
 */
// The day/night cards (design "Group 94"): pastel panel over a white label
// strip with a khaki bottom edge — the edge turns green when picked.
const compactCardClass = (selected: boolean, spotlight: boolean) =>
  `rounded-[5.8px] transition-[scale,translate,outline-color] duration-200 ease-out active:translate-y-[2px] ${
    selected || spotlight ? "[&>span:last-child]:border-b-primary" : ""
  } ${spotlight ? "scale-[1.04]" : ""} ${selected ? "outline-2 outline-primary dark:outline-0" : ""}`;

export function QuestionGridOptions({
  options,
  selectedId,
  spokenOption,
  onPick,
  compact = false,
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

  // More than four options: three cards per row (narrower, same design).
  // Columns are fluid with a fixed gap and aspect ratio, so on narrow screens
  // the cards shrink together instead of colliding.
  const three = options.length > 4;

  return (
    // `auto-rows-max` keeps each row the full tile height: on short screens
    // auto rows shrank below the (aspect-ratio'd) tiles, which then spilled
    // over the gap into the next row. Now the gap is always gap-y-3 and the
    // grid scrolls instead.
    <div ref={optionsRef} className={`scrollbar-none mx-auto ${compact ? "-mt-1.5" : "-mt-1 sm:mt-0"} grid w-full ${compact ? "max-w-[313px] grid-cols-2 gap-x-[19px] gap-y-4" : three ? "max-w-[374px] grid-cols-3 gap-x-[17px] gap-y-6" : "max-w-[322px] grid-cols-2 gap-x-[30px] gap-y-[29px]"} min-h-0 flex-1 auto-rows-max content-start overflow-y-auto px-2 pt-6 pb-2`}>
      {options.map((option, i) => {
        const selected = option.id === selectedId;
        const spotlight = !selected && i === spokenOption;
        const lit = selected || spotlight;
        const { icon: Icon, fg } = ILLUSTRATIONS[option.illustration];
        return (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            {...optionDropIn(i)}
            // Figma "Group 94" (138x150): the picture over a 43.65px label
            // strip, straight on the card (no tinted panel). Light: the
            // card's own khaki bottom edge from optionCardClass. Dark: each
            // segment draws its own stroke (#818185 idle, #00B8A9 selected),
            // the picture with no fill and the label on 20% white.
            style={option.tint ? ({ "--tint": option.tint } as React.CSSProperties) : undefined}
            className={`flex flex-col overflow-hidden w-full min-w-0 ${compact ? "aspect-139/109" : three ? "aspect-108/130" : "aspect-138/150"} text-center ${compact ? compactCardClass(selected, spotlight) : optionCardClass(selected, spotlight, true)}`}
          >
            <span
              className={`flex min-h-0 w-full items-center justify-center dark:rounded-t-[8px] dark:border-[3px] dark:border-b-0 ${compact ? "h-[60.55%] flex-none rounded-t-[5.8px] bg-(--tint) p-[7.25px] dark:rounded-t-[8px] dark:bg-[#0F1F26] dark:p-[7px]" : "flex-1 dark:p-2.5"} ${
                lit ? "dark:border-[#00B8A9]" : "dark:border-[#818185]"
              }`}
            >
              {option.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.image}
                  alt=""
                  draggable={false}
                  style={compact && option.imageSize ? { width: option.imageSize[0], height: option.imageSize[1] } : undefined}
                  className={`${compact ? "max-h-full max-w-full" : "h-[calc(100%-1.25rem)] w-[calc(100%-1.25rem)]"} object-contain ${compact ? "dark:h-[43px] dark:w-[42px]" : "dark:h-[74px] dark:w-[80px]"}`}
                />
              ) : (
                <Icon className={`h-14 w-14 ${fg}`} strokeWidth={1.75} />
              )}
            </span>
            <span
              className={`${poppins.className} flex w-full shrink-0 items-center justify-center px-2 text-balance ${three ? "h-[40px] text-[12px]" : compact ? "min-h-0 flex-1 text-[14px]" : "h-[43.65px] text-[14px]"} font-medium ${compact ? "leading-[1.4]" : "leading-[1.3]"} ${compact ? "text-[#444444] bg-white rounded-b-[5.8px] border-b-[4.35px] border-b-[#BDBA99] dark:rounded-b-[8px]" : "text-[#2C2C2C]"} dark:text-white dark:rounded-b-[8px] dark:border-x-[3px] dark:border-b-[6px] ${compact ? "dark:bg-[#3F4C51]" : "dark:bg-white/20"} ${
                lit ? "dark:border-[#00B8A9]" : "dark:border-[#818185]"
              }`}
            >
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
