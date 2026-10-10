"use client";

import { Inter } from "next/font/google";
import type { TextSpan } from "@/lib/constants/onboarding";
import { ZoxTabFox } from "./robu/ZoxTabFox";
import { spansLength } from "./OnboardingBubble";
import type { Voiceover } from "./useVoiceover";

// Question headings: Inter 600, 20px.
const inter = Inter({ subsets: ["latin"], weight: ["600", "700"] });

/**
 * How far through its own clip (0..1) the question text has been spoken:
 * the first clip of a question screen's voiceover reads the question. Once
 * that clip is over — or with no voice, or if it couldn't play — the whole
 * question counts as spoken.
 */
export function questionSpoken(voice: Voiceover, hasVoice: boolean): number {
  if (!hasVoice || voice.status === "failed" || voice.status === "done")
    return 1;
  if (voice.status === "idle") return 0;
  return voice.clip === 0 ? voice.clipProgress : 1;
}

/**
 * Which option (index) the voice is reading right now, or -1. The second
 * clip of a question screen's voiceover reads the options in order, so it's
 * split evenly between them; outside that clip, no option is spoken.
 */
export function spokenOptionIndex(
  voice: Voiceover,
  optionCount: number,
): number {
  if (!voice.playing || voice.clip !== 1 || optionCount === 0) return -1;
  return Math.min(
    optionCount - 1,
    Math.floor(voice.clipProgress * optionCount),
  );
}

interface QuestionHeadingProps {
  heading: TextSpan[];
  /** 0..1 — see questionSpoken. */
  spoken: number;
  /** The fox's mouth moves while this is true. */
  talking: boolean;
  /** Set anew (`Date.now()`) on each option pick; Zox looks at his tablet and types. */
  typing?: number;
  /** Changes with each new question; Zox looks back up at the user. */
  screenId?: string;
  /** "row": Zox to the left of a left-aligned heading; default is the
   * heading centered with Zox below. */
  layout?: "stacked" | "row";
  /** Zox beside the question (default true) — off where the design has no
   * fox in the question row. */
  showFox?: boolean;
}

/** The same karaoke fill-in as QuestionHeading's, without Zox: a big centered
 * title for the career question, whose tiles fill the screen instead. */
export function QuestionTilesHeading({
  heading,
  spoken,
}: Pick<QuestionHeadingProps, "heading" | "spoken">) {
  const total = spansLength(heading);
  const lit = spoken >= 1 ? total : Math.floor(spoken * total);
  return (
    // Figma: 228px wide (so it breaks "…the career / you're chasing?"),
    // 24px Inter 700 at 134%; the 260px max-width is that plus the px-4.
    <h1 className={`${inter.className} mx-auto w-full max-w-[260px] shrink-0 px-4 pt-5 text-center text-[24px] font-bold leading-[1.34] text-[#2C2C2C] [@media(min-height:760px)]:pt-14 dark:text-white`}>
      {heading.map((span, i) => {
        const start = spansLength(heading.slice(0, i));
        const cut = Math.max(0, Math.min(span.text.length, lit - start));
        return (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text.slice(0, cut)}
            {cut < span.text.length && (
              <span className="opacity-35 transition-opacity">{span.text.slice(cut)}</span>
            )}
          </span>
        );
      })}
    </h1>
  );
}

/**
 * Zox (with his tablet) + question row at the top of both question
 * screens. While the
 * question is being read out, its text fills in karaoke-style: the part
 * already spoken is at full strength, the rest faded, so the highlight moves
 * along with the voice.
 */
export function QuestionHeading({
  heading,
  spoken,
  typing,
  screenId,
  layout = "stacked",
  showFox = true,
}: QuestionHeadingProps) {
  const total = spansLength(heading);
  const lit = spoken >= 1 ? total : Math.floor(spoken * total);
  const parts = heading.map((span, i) => {
    const start = spansLength(heading.slice(0, i));
    return { span, cut: Math.max(0, Math.min(span.text.length, lit - start)) };
  });

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 pt-2 sm:pt-3">
      {showFox && (
        <div aria-hidden className="relative shrink-0">
          <ZoxTabFox
            className="h-[6rem] w-[6rem] sm:h-[7rem] sm:w-[7rem]"
            typing={typing}
            screenId={screenId}
          />
        </div>
      )}
      <h1 className="max-w-60 text-[20px] font-medium leading-snug text-[#1A1C22] sm:max-w-72 dark:text-white">
        {parts.map(({ span, cut }, i) => (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text.slice(0, cut)}
            {cut < span.text.length && (
              <span className="opacity-35 transition-opacity">
                {span.text.slice(cut)}
              </span>
            )}
          </span>
        ))}
      </h1>
    </div>
  );
}
