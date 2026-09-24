"use client";

import { useState } from "react";
import { Sparkle } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { OnboardingFox } from "./robu/OnboardingFox";
import { OnboardingBubble } from "./OnboardingBubble";
import { Button3D } from "@/components/ui/Button3D";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";

interface FoxMessageScreenProps {
  heading?: TextSpan[];
  /** "bottom": bubble above the fox, heading below it — see
   * OnboardingStep's `headingPlacement`. */
  headingPlacement?: "top" | "bottom";
  sparkle?: boolean;
  bubble: TextSpan[];
  /** Fox waves hello once on mount — see OnboardingFox's `greet`. */
  greet?: boolean;
  /** Played once the bubble has popped in, in step with its typing. */
  voiceover?: readonly string[];
  muted?: boolean;
  cta: string;
  onContinue: () => void;
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
  muted = false,
  cta,
  onContinue,
  className,
}: FoxMessageScreenProps) {
  // The fox talks while its bubble types and for as long as its voice plays.
  const [typing, setTyping] = useState(false);
  const [bubbleIn, setBubbleIn] = useState(false);
  const speaking = useVoiceover(voiceover, bubbleIn, muted);
  const talking = typing || speaking;
  const markBubbleIn = () => setBubbleIn(true);
  const headingOnTop = !!heading && headingPlacement === "top";
  const headingBelow = !!heading && headingPlacement === "bottom";

  const headingBlock = heading && (
    <div className="relative flex shrink-0 items-start gap-1.5">
      <h1 className="max-w-xs text-center text-xl font-semibold leading-snug text-[#1A1C22] sm:text-2xl">
        {heading.map((span, i) => (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text}
          </span>
        ))}
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
        {!headingOnTop && <OnboardingBubble spans={bubble} tail="down" onTypingChange={setTyping} onEntered={markBubbleIn} />}
        <OnboardingFox greet={greet} talking={talking} className="aspect-square h-[min(12rem,28dvh)] shrink" />
        {headingOnTop && <OnboardingBubble spans={bubble} tail="up" onTypingChange={setTyping} onEntered={markBubbleIn} />}
        {headingBelow && <div className="mt-2">{headingBlock}</div>}
      </div>

      <div className="w-full max-w-xs shrink-0 pb-4 sm:max-w-sm sm:pb-6">
        <Button3D onClick={onContinue} onPress={playClickSound} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
