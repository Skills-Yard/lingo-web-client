"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { TextSpan } from "@/lib/constants/onboarding";
import { ZoxTabFox } from "./robu/ZoxTabFox";
import { OnboardingQuestionHex } from "./robu/OnboardingQuestionHex";
import { ONBOARDING_QUESTION_CLASS } from "./headingStyle";
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
  /** The screen is being left: the heading floats back up and out. */
  leaving?: boolean;
  /** Seconds to hold the heading before it leaves. */
  leaveDelay?: number;
}

/**
 * One span of a heading: the first `cut` characters at full strength, the rest
 * faded. The gradient is only on the part already spoken. The faded remainder
 * is a plain mid-teal at low opacity instead: Safari paints `background-clip:
 * text` through the glyphs at full strength whatever the element's opacity, so
 * a gradient remainder would already show in full before it is spoken.
 */
function KaraokeSpan({
  text,
  cut,
  highlight,
  highlightClass = "text-brand-gradient",
}: {
  text: string;
  cut: number;
  highlight?: boolean;
  /** The class that colors the spoken highlighted words. */
  highlightClass?: string;
}) {
  return (
    <>
      {cut > 0 && (
        <span className={highlight ? highlightClass : undefined}>{text.slice(0, cut)}</span>
      )}
      {cut < text.length && (
        <span className={`${highlight ? "text-[#0a9eae]" : ""} opacity-35 transition-opacity`}>
          {text.slice(cut)}
        </span>
      )}
    </>
  );
}

/**
 * A text that fills in karaoke-style as it's spoken: `spoken` (0..1, see
 * questionSpoken) of it at full strength, the rest faded. For screens that
 * show their own text instead of the Zox + question row.
 */
export function KaraokeSpans({ spans, spoken, highlightClass }: { spans: TextSpan[]; spoken: number; highlightClass?: string }) {
  const total = spansLength(spans);
  const lit = spoken >= 1 ? total : Math.floor(spoken * total);
  return (
    <>
      {spans.map((span, i) => {
        const start = spansLength(spans.slice(0, i));
        const cut = Math.max(0, Math.min(span.text.length, lit - start));
        return <KaraokeSpan key={i} text={span.text} cut={cut} highlight={span.highlight} highlightClass={highlightClass} />;
      })}
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
  leaving = false,
  leaveDelay = 0,
}: QuestionHeadingProps) {
  // Every question row (career, reactions artboards, list questions) shares
  // the same big fox and spacing. The list questions' own Hex artboard draws
  // smaller inside its box than the reactions one, so its box is larger.
  const big = !wide;
  const total = spansLength(heading);
  const lit = spoken >= 1 ? total : Math.floor(spoken * total);
  const parts = heading.map((span, i) => {
    const start = spansLength(heading.slice(0, i));
    return { span, cut: Math.max(0, Math.min(span.text.length, lit - start)) };
  });

  return (
    // Under a scene the heading hangs off the artboard's bottom edge with a
    // short, fixed gap rather than the usual header offset.
    <div className={`flex shrink-0 ${wide ? "items-center justify-center" : "items-center justify-start"} gap-2 ${wide ? "pt-3" : "sm:pt-0"}`}>
      {(hex || showFox) && (
        // The artboard has empty margins, so the slot beside the question is
        // a fixed box, no taller than the fox itself and narrower than it: it draws bigger than the slot
        // (anchored to its top-left, so a bigger fox grows downward and the
        // row keeps the screen's 16px side margin) and the question overlaps
        // the empty space. Resizing the fox therefore never moves the question.
        <div
          aria-hidden
          className={`relative z-20 shrink-0 ${
            big ? (hex ? "h-[6.5rem] w-[5rem]" : "h-[6.25rem] w-[5.75rem]") : "h-[6rem] w-[4.5rem]"
          } sm:h-[7rem] sm:w-[5.5rem]`}
        >
          <div
            className={`absolute left-0 ${
              big ? (hex ? "-top-3 h-[9rem] w-[9rem]" : "-top-8 h-[10.5rem] w-[10.5rem]") : "top-0 h-[6rem] w-[6rem]"
            } sm:top-0 sm:h-[7rem] sm:w-[7rem]`}
          >
            {hex ??
              (foxMode === "onboarding" ? (
                <OnboardingQuestionHex
                  className="h-full w-full"
                  typing={typing ?? 0}
                  screenId={screenId ?? ""}
                  speaking={talking && spoken < 1}
                  questionSpoken={spoken}
                  spokenOption={spokenOption}
                />
              ) : (
                <ZoxTabFox className="h-full w-full" typing={typing} screenId={screenId} />
              ))}
          </div>
        </div>
      )}
      {/* Keyed on the question so only the text re-animates (fades in from
        above); the fox beside it stays mounted. */}
      <motion.h1
        key={screenId}
        initial={{ opacity: 0, y: -60 }}
        animate={leaving ? { opacity: 0, y: -60 } : { opacity: 1, y: 0 }}
        transition={leaving ? { duration: 0.4, ease: [0.5, 0, 1, 1], delay: leaveDelay } : {
          opacity: { duration: 0.3, delay: 0.3 },
          y: { type: "spring", stiffness: 110, damping: 13, delay: 0.3 },
        }}
        className={`relative z-10 ${wide ? "w-full max-w-[335px] text-center" : "min-w-0 flex-1 pl-16 text-left"} ${headingClassName}`}
      >
        {parts.map(({ span, cut }, i) => (
          <KaraokeSpan key={i} text={span.text} cut={cut} highlight={span.highlight} />
        ))}
      </motion.h1>
    </div>
  );
}
