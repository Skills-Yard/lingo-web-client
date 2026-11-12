"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { GAP_ABOVE_BUTTONS } from "@/components/level-two/AnswerCards";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { variableHref } from "@/lib/routes";
import { fireSceneTrigger } from "@/lib/rive/variableHost";
import { CompleteBackdrop, SCENE_BOTTOM_LIFTED } from "./scenes";
import { parseTitle } from "./quiz";
import { STEP, variablePrevious, VARIABLE_STEPS } from "./variable";

const TITLE = parseTitle("You *Unlocked Variables!*");

const TAKEAWAYS = [
  "Programs keep track of information.",
  "Variables give information names.",
  "A variable has a name and a value.",
  "Values can change.",
  "Different variables track different things.",
  "Variables help programs calculate.",
];

const FINAL_THOUGHT = "Variables help programs remember information and use it later.";

/** How tall the takeaways and the closing thought are together (px): the list (six lines), a gap and the thought (two lines). */
const TEXT_BLOCK_H = 232;
/** How far under the scene's bottom edge they start (px). */
const GAP_BELOW_SCENE = 12;
/** The scene plays its introduction, and then celebrates this long (ms) after the screen opens. */
const CELEBRATE_MS = 1800;

/**
 * "You Unlocked Variables!": the chapter's things connect to one central idea, in the scene behind the screen
 * ("VAR_Complete", see `CompleteBackdrop`; there is no Hex bubble here, so it stands in the room under the title), with
 * the takeaways and the closing thought under it. "Complete Chapter" opens the gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(variableHref("complete"));
  }, [router]);

  // Once the scene has put the chapter's things around the idea, it celebrates.
  useEffect(() => {
    const timer = window.setTimeout(() => fireSceneTrigger("complete", "celebrate"), CELEBRATE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LevelTwoShell
      step={STEP.recap}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.recap))}
      scene={<CompleteBackdrop lifted />}
      ctaLabel="Complete Chapter"
      onContinue={() => setGemOpen(true)}
      overlay={<GemPopup open={gemOpen} onClose={closeGem} />}
    >
      <ScreenTitle oneLine={!TITLE.twoLines}>
        <span style={{ fontSize: TITLE.size }}>
          {TITLE.parts.map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="text-level-gradient">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      </ScreenTitle>

      {/* Right under the scene's bottom edge, or higher where that would run down behind the button (a wider window draws the scene larger). */}
      <div
        className="absolute left-1/2 flex w-[340px] -translate-x-1/2 flex-col gap-2.5"
        style={{ top: `min(calc(${SCENE_BOTTOM_LIFTED} + ${GAP_BELOW_SCENE}px), calc(100% - ${aboveButtons(GAP_ABOVE_BUTTONS)} - ${TEXT_BLOCK_H}px))` }}
      >
        <ol className="flex flex-col gap-1.5 rounded-[14px] bg-[#E3F6F3] px-4 py-3 dark:bg-[#0F2B28]">
          {TAKEAWAYS.map((point, index) => (
            <li key={point} className="flex items-start gap-2 text-[13px] leading-[18px] font-medium text-[#2F5D59] dark:text-[#BFE6E2]">
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#04ACAB] text-[10px] leading-none font-bold text-white">{index + 1}</span>
              {point}
            </li>
          ))}
        </ol>
        <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-4 py-3 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
          {FINAL_THOUGHT}
        </p>
      </div>
    </LevelTwoShell>
  );
}
