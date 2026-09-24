"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TextSpan } from "@/lib/constants/onboarding";
import { DialogueBubble } from "@/components/ui/DialogueBubble";

// The bubble pops in first — delayed so the screen's own crossfade (see
// OnboardingFlow's SCREEN_TRANSITION) is mostly done — and the text and voice
// only start once that entrance has finished (see `onEntered`).
const BUBBLE_IN_DELAY_S = 0.25;
const BUBBLE_IN = { type: "spring", stiffness: 420, damping: 26 } as const;

export function spansLength(spans: TextSpan[]): number {
  return spans.reduce((n, span) => n + span.text.length, 0);
}

/**
 * Typewriter text that never reflows: the full text is laid out from the
 * first frame, with the first `shown` characters visible and the rest just
 * transparent — so its box is already at its final size and every line
 * already wraps where it will end up. Typing only reveals letters in place.
 * The caret sits at the boundary while typing, as a zero-width inline so it
 * never affects wrapping either.
 */
export function TypedText({ spans, shown }: { spans: TextSpan[]; shown: number }) {
  const total = spansLength(spans);
  const starts = spans.map((_, i) => spansLength(spans.slice(0, i)));
  return (
    <>
      {spans.map((span, i) => {
        const start = starts[i];
        const end = start + span.text.length;
        const cut = Math.max(0, Math.min(span.text.length, shown - start));
        const caretHere = shown > 0 && shown < total && shown >= start && shown < end;
        return (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text.slice(0, cut)}
            {caretHere && <Caret />}
            {cut < span.text.length && (
              <span className="text-transparent">{span.text.slice(cut)}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

function Caret() {
  return (
    <span aria-hidden className="relative">
      <span className="absolute left-0 top-1/2 h-[1em] w-0.5 -translate-y-1/2 animate-pulse bg-primary" />
    </span>
  );
}

interface OnboardingBubbleProps {
  spans: TextSpan[];
  /** How many characters are typed so far — driven by the screen (see
   * FoxMessageScreen), which paces it to the voiceover when there is one. */
  shown: number;
  /** "down" (tail points down, into a fox below the bubble) or "up" (tail
   * points up, into a fox above the bubble) — matches whichever of the two
   * bubble/fox arrangements the reference design uses for a given screen. */
  tail: "down" | "up";
  className?: string;
  /** False keeps the bubble invisible in its spot (so the layout doesn't
   * shift) and holds its entrance until this turns true. Defaults to true. */
  show?: boolean;
  /** Fires once the bubble has finished popping in (immediately, with
   * reduced motion) — the moment its text and voice start. */
  onEntered?: () => void;
}

/**
 * The onboarding flow's speech bubble — the onboarding flow's own lightweight
 * version of instructions-intro's `SpeechBubble`, which this flow doesn't
 * reuse directly since it's wired to that flow's specific mouth-sync
 * machinery (RobuTalkingContext) that doesn't apply here (no persistent
 * gliding mascot in this flow, just a per-screen fox).
 *
 * The bubble springs in from its tail, then shows its text typed out to
 * `shown` characters (see TypedText — the bubble is at its final size
 * throughout).
 *
 * The shape itself (outline, flat shadow, tail) is the shared
 * `DialogueBubble`; this just gives it the onboarding flow's text styling and
 * pads the wrapper out to the tail's tip, so callers spacing this against a
 * fox (e.g. `gap-4`) measure to the tip rather than to the box.
 */
export function OnboardingBubble({
  spans,
  shown,
  tail,
  className,
  show = true,
  onEntered,
}: OnboardingBubbleProps) {
  const reduceMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (entered || (reduceMotion && show)) onEntered?.();
    // onEntered excluded — callers pass a fresh inline function each render;
    // this should only fire when the bubble's own state flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, reduceMotion, show]);

  const hidden = { opacity: 0, scale: 0.6, y: tail === "down" ? 12 : -12 };
  return (
    <motion.div
      className={`inline-block ${className ?? ""}`}
      style={{ transformOrigin: tail === "down" ? "50% 100%" : "50% 0%" }}
      initial={reduceMotion && show ? false : hidden}
      animate={show ? { opacity: 1, scale: 1, y: 0 } : hidden}
      transition={{ ...BUBBLE_IN, delay: BUBBLE_IN_DELAY_S }}
      onAnimationComplete={() => {
        if (show) setEntered(true);
      }}
    >
      <DialogueBubble
        tail={tail}
        // The tail overhangs the wrapper on its own side (16px, hence
        // pt-4/pb-4); on the other side the flat shadow still spills 3px past
        // the box, so "up" gets that much room below too.
        className={`max-w-xs sm:max-w-sm ${tail === "up" ? "pt-4 pb-0.75" : "pb-4"}`}
        contentClassName="whitespace-pre-line text-balance px-3 py-3 text-center text-base font-medium leading-tight text-black sm:px-6 sm:py-3.5"
      >
        <TypedText spans={spans} shown={shown} />
      </DialogueBubble>
    </motion.div>
  );
}
