"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Sparkle } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { OnboardingFox } from "./robu/OnboardingFox";
import { OnboardingBubble, TypedText, spansLength } from "./OnboardingBubble";
import { useVoiceover } from "./useVoiceover";

/** Typing speed for screens with no voice (or whose voice couldn't play). */
const TYPE_SPEED_MS = 30;

interface FoxMessageScreenProps {
  heading?: TextSpan[];
  /** "bottom": bubble above the fox, heading below it — see
   * OnboardingStep's `headingPlacement`. */
  headingPlacement?: "top" | "bottom";
  sparkle?: boolean;
  bubble: TextSpan[];
  /** Fox waves hello once on mount — see OnboardingFox's `greet`. */
  greet?: boolean;
  /** Played once the bubble has popped in. The text types along with it —
   * paced so the last letter lands as the voice ends — and the fox's mouth
   * moves exactly while it plays. */
  voiceover?: readonly string[];
  /** Whether the voiceover reads the heading too (default true). When
   * false, the heading shows in full and only the bubble types along. */
  voiceReadsHeading?: boolean;
  muted?: boolean;
  className?: string;
}

/**
 * Robu's plain "message" screen, in one of three layouts matching the
 * reference design per screen: bubble-above-fox with no heading (the
 * greeting, "Perfect starting point"), heading-then-fox-then-bubble
 * ("Building Career Path..."), or bubble-then-fox-then-heading ("Are you
 * ready?", `headingPlacement="bottom"`).
 */
export function FoxMessageScreen({
  heading,
  headingPlacement = "top",
  sparkle,
  bubble,
  greet,
  voiceover,
  voiceReadsHeading = true,
  muted = false,
  className,
}: FoxMessageScreenProps) {
  const reduceMotion = useReducedMotion();
  const [bubbleIn, setBubbleIn] = useState(false);
  const markBubbleIn = () => setBubbleIn(true);
  const headingOnTop = !!heading && headingPlacement === "top";
  const headingBelow = !!heading && headingPlacement === "bottom";

  // Voice, text and mouth all start together, the moment the bubble has
  // popped in. With a voice, the typed text follows its playback position
  // (the voice reads the heading too, so a voiced screen types its heading
  // as well, in reading order) and the mouth moves exactly while it plays;
  // without one — or if the browser refused to play it — the text types at
  // a fixed speed and the mouth moves while it types.
  const hasVoice = !!voiceover?.length;
  const voice = useVoiceover(voiceover, bubbleIn, muted);
  const synced = hasVoice && voice.status !== "failed";

  const bubbleLen = spansLength(bubble);
  const typesHeading = hasVoice && voiceReadsHeading;
  const headingLen = heading && typesHeading ? spansLength(heading) : 0;
  const total = bubbleLen + headingLen;

  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!bubbleIn || synced || reduceMotion || ticks >= total) return;
    const timer = window.setTimeout(() => setTicks((t) => t + 1), TYPE_SPEED_MS);
    return () => window.clearTimeout(timer);
  }, [bubbleIn, synced, reduceMotion, ticks, total]);

  const shown = reduceMotion
    ? total
    : synced
      ? voice.status === "done"
        ? total
        : Math.floor(voice.progress * total)
      : ticks;
  const talking = synced ? voice.playing : bubbleIn && !reduceMotion && shown < total;

  // Reading order: a heading above the fox is read before the bubble, one
  // below it after.
  const bubbleShown = headingOnTop ? shown - headingLen : shown;
  const headingShown = headingOnTop ? shown : shown - bubbleLen;

  const headingBlock = heading && (
    <div className="relative flex shrink-0 items-start gap-1.5">
      <h1 className="max-w-xs text-center text-xl font-semibold leading-snug text-[#1A1C22] sm:text-2xl">
        {typesHeading ? (
          <TypedText spans={heading} shown={headingShown} />
        ) : (
          heading.map((span, i) => (
            <span key={i} className={span.highlight ? "text-primary" : undefined}>
              {span.text}
            </span>
          ))
        )}
      </h1>
      {sparkle && (
        <Sparkle
          aria-hidden
          className="h-4 w-4 shrink-0 fill-primary text-primary"
        />
      )}
    </div>
  );

  return (
    <div className={`flex flex-col items-center min-h-0 bg-white px-6 ${className ?? ""}`}>
      {headingOnTop && <div className="mt-[3dvh] shrink-0">{headingBlock}</div>}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        {!headingOnTop && <OnboardingBubble spans={bubble} shown={bubbleShown} tail="down" onEntered={markBubbleIn} />}
        <OnboardingFox greet={greet} talking={talking} className="aspect-square h-[min(12rem,28dvh)] shrink" />
        {headingOnTop && <OnboardingBubble spans={bubble} shown={bubbleShown} tail="up" onEntered={markBubbleIn} />}
        {headingBelow && <div className="mt-2">{headingBlock}</div>}
      </div>
    </div>
  );
}
