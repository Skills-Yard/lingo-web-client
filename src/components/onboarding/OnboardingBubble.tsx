"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TextSpan } from "@/lib/constants/onboarding";
import { DialogueBubble } from "@/components/ui/DialogueBubble";

// The bubble pops in first — delayed so the screen's own crossfade (see
// OnboardingFlow's SCREEN_TRANSITION) is mostly done — and the text only
// starts typing once that entrance has finished.
const BUBBLE_IN_DELAY_S = 0.25;
const BUBBLE_IN = { type: "spring", stiffness: 420, damping: 26 } as const;
/** Milliseconds per character of the typewriter. */
const TYPE_SPEED_MS = 30;

interface OnboardingBubbleProps {
  spans: TextSpan[];
  /** "down" (tail points down, into a fox below the bubble) or "up" (tail
   * points up, into a fox above the bubble) — matches whichever of the two
   * bubble/fox arrangements the reference design uses for a given screen. */
  tail: "down" | "up";
  className?: string;
  /** Fires `true` when the text starts typing and `false` once it's done —
   * lets the screen move the fox's mouth for exactly that span. */
  onTypingChange?: (typing: boolean) => void;
  /** Fires once the bubble has finished popping in (immediately, with
   * reduced motion) — the moment its text starts typing. */
  onEntered?: () => void;
}

/**
 * The onboarding flow's speech bubble — the onboarding flow's own lightweight
 * version of instructions-intro's `SpeechBubble`, which this flow doesn't
 * reuse directly since it's wired to that flow's specific mouth-sync
 * machinery (RobuTalkingContext) that doesn't apply here (no persistent
 * gliding mascot in this flow, just a per-screen fox).
 *
 * The bubble springs in from its tail, then types its text out. The full
 * text is laid out from the first frame with the not-yet-typed characters
 * just transparent, so the bubble is already at its final size and every
 * line already wraps where it will end up — typing only reveals letters in
 * place, never resizes the bubble or reflows the text.
 *
 * The shape itself (outline, flat shadow, tail) is the shared
 * `DialogueBubble`; this just gives it the onboarding flow's text styling and
 * pads the wrapper out to the tail's tip, so callers spacing this against a
 * fox (e.g. `gap-4`) measure to the tip rather than to the box.
 */
export function OnboardingBubble({
  spans,
  tail,
  className,
  onTypingChange,
  onEntered,
}: OnboardingBubbleProps) {
  const reduceMotion = useReducedMotion();
  const total = spans.reduce((n, span) => n + span.text.length, 0);
  const [entered, setEntered] = useState(false);
  const [typed, setTyped] = useState(0);
  const shown = reduceMotion ? total : typed;

  useEffect(() => {
    if (!entered || reduceMotion || typed >= total) return;
    const timer = window.setTimeout(() => setTyped(typed + 1), TYPE_SPEED_MS);
    return () => window.clearTimeout(timer);
  }, [entered, reduceMotion, typed, total]);

  useEffect(() => {
    if (entered || reduceMotion) onEntered?.();
    // Same reasoning as onTypingChange below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, reduceMotion]);

  const typing = entered && !reduceMotion && typed < total;
  useEffect(() => {
    onTypingChange?.(typing);
    // onTypingChange excluded — callers pass a fresh inline function each
    // render; this should only fire when `typing` itself flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing]);

  // Splits every span at the typed/untyped boundary; the caret goes right at
  // that boundary as a zero-width inline, so it never affects wrapping.
  const starts = spans.map((_, i) =>
    spans.slice(0, i).reduce((n, span) => n + span.text.length, 0),
  );
  const content = spans.map((span, i) => {
    const start = starts[i];
    const end = start + span.text.length;
    const cut = Math.max(0, Math.min(span.text.length, shown - start));
    const caretHere = shown < total && shown >= start && shown < end;
    return (
      <span key={i} className={span.highlight ? "text-primary" : undefined}>
        {span.text.slice(0, cut)}
        {caretHere && <Caret />}
        {cut < span.text.length && (
          <span className="text-transparent">{span.text.slice(cut)}</span>
        )}
      </span>
    );
  });

  return (
    <motion.div
      className={`inline-block ${className ?? ""}`}
      style={{ transformOrigin: tail === "down" ? "50% 100%" : "50% 0%" }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: tail === "down" ? 12 : -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...BUBBLE_IN, delay: BUBBLE_IN_DELAY_S }}
      onAnimationComplete={() => setEntered(true)}
    >
      <DialogueBubble
        tail={tail}
        // The tail overhangs the wrapper on its own side (16px, hence
        // pt-4/pb-4); on the other side the flat shadow still spills 3px past
        // the box, so "up" gets that much room below too.
        className={`max-w-xs sm:max-w-sm ${tail === "up" ? "pt-4 pb-0.75" : "pb-4"}`}
        contentClassName="whitespace-pre-line text-balance px-3 py-3 text-center text-base font-medium leading-tight text-black sm:px-6 sm:py-3.5"
      >
        {content}
      </DialogueBubble>
    </motion.div>
  );
}

function Caret() {
  return (
    <span aria-hidden className="relative">
      <span className="absolute left-0 top-1/2 h-[1em] w-0.5 -translate-y-1/2 animate-pulse bg-primary" />
    </span>
  );
}
