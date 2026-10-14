"use client";

import type { ReactNode } from "react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { ZoxTabFox } from "./robu/ZoxTabFox";
import { OnboardingQuestionHex } from "./robu/OnboardingQuestionHex";
import { ONBOARDING_QUESTION_CLASS, ONBOARDING_TOP_OFFSET_CLASS } from "./headingStyle";
import { spansLength } from "./OnboardingBubble";
import type { Voiceover } from "./useVoiceover";

// Question headings: Inter 600, 20px.

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
  /** Index of the option the voice is reading, or -1 — Hex talks for each. */
  spokenOption?: number;
  /** "row": Zox to the left of a left-aligned heading; default is the
   * heading centered with Zox below. */
  layout?: "stacked" | "row";
  /** Zox beside the question (default true) — off where the design has no
   * fox in the question row. */
  showFox?: boolean;
  /** "onboarding": the fox plays Hex's `Onboarding` state machine (see
   * OnboardingQuestionHex) instead of the tablet poses. */
  foxMode?: "tablet" | "onboarding";
  /** Replaces the fox in its slot — the reactions artboard on the grid
   * questions that have one. */
  hex?: ReactNode;
  /** Text style of the heading — the 20px question style by default. */
  headingClassName?: string;
  /** Full-width (335px) heading with nothing beside it — under a scene. */
  wide?: boolean;
}

/**
 * One span of a heading: the first `cut` characters at full strength, the rest
 * faded. A highlighted span's gradient is on each part itself rather than on
 * a wrapper — a wrapper's `background-clip: text` ignores the faded child's
 * opacity and would paint it at full strength.
 */
function KaraokeSpan({
  text,
  cut,
  highlight,
}: {
  text: string;
  cut: number;
  highlight?: boolean;
}) {
  const color = highlight ? "text-brand-gradient" : "";
  return (
    <>
      <span className={color}>{text.slice(0, cut)}</span>
      {cut < text.length && (
        <span className={`${color} opacity-35 transition-opacity`}>{text.slice(cut)}</span>
      )}
    </>
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
  talking,
  typing,
  screenId,
  spokenOption,
  layout = "stacked",
  showFox = true,
  foxMode = "tablet",
  hex,
  headingClassName = ONBOARDING_QUESTION_CLASS,
  wide = false,
}: QuestionHeadingProps) {
  const total = spansLength(heading);
  const lit = spoken >= 1 ? total : Math.floor(spoken * total);
  const parts = heading.map((span, i) => {
    const start = spansLength(heading.slice(0, i));
    return { span, cut: Math.max(0, Math.min(span.text.length, lit - start)) };
  });

  return (
    // Under a scene the heading hangs off the artboard's bottom edge with a
    // short, fixed gap rather than the usual header offset.
    <div className={`flex shrink-0 items-center justify-center gap-3 ${wide ? "pt-3" : ONBOARDING_TOP_OFFSET_CLASS}`}>
      {hex ? (
        <div aria-hidden className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          {hex}
        </div>
      ) : showFox && (
        <div aria-hidden className="relative shrink-0">
          {foxMode === "onboarding" ? (
            <OnboardingQuestionHex
              className="h-[6rem] w-[6rem] sm:h-[7rem] sm:w-[7rem]"
              typing={typing ?? 0}
              screenId={screenId ?? ""}
              speaking={talking && spoken < 1}
              questionSpoken={spoken}
              spokenOption={spokenOption}
            />
          ) : (
            <ZoxTabFox
              className="h-[6rem] w-[6rem] sm:h-[7rem] sm:w-[7rem]"
              typing={typing}
              screenId={screenId}
            />
          )}
        </div>
      )}
      <h1 className={`${wide ? "w-full max-w-[335px]" : "max-w-60 sm:max-w-72"} text-left ${headingClassName}`}>
        {parts.map(({ span, cut }, i) => (
          <KaraokeSpan key={i} text={span.text} cut={cut} highlight={span.highlight} />
        ))}
      </h1>
    </div>
  );
}
