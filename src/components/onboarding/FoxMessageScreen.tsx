import { Sparkle } from "lucide-react";
import type { TextSpan } from "@/lib/constants/onboarding";
import { OnboardingFox } from "./robu/OnboardingFox";
import { OnboardingBubble } from "./OnboardingBubble";
import { Button3D } from "@/components/ui/Button3D";

interface FoxMessageScreenProps {
  heading?: TextSpan[];
  sparkle?: boolean;
  bubble: TextSpan[];
  /** Fox waves hello once on mount — see OnboardingFox's `greet`. */
  greet?: boolean;
  cta: string;
  onContinue: () => void;
  className?: string;
}

/**
 * Robu's plain "message" screen: either bubble-above-fox with no heading
 * (the greeting, "Perfect starting point") or heading-then-fox-then-bubble
 * (the "7 quick questions"/"Building Career Path..." reveal) — which
 * arrangement depends only on whether `heading` is given, matching exactly
 * which of the two layouts the reference design uses per screen.
 */
export function FoxMessageScreen({
  heading,
  sparkle,
  bubble,
  greet,
  cta,
  onContinue,
  className,
}: FoxMessageScreenProps) {
  return (
    <div className={`flex flex-col items-center min-h-0 bg-white px-6 ${className ?? ""}`}>
      {heading && (
        <div className="relative mt-[3dvh] flex shrink-0 items-start gap-1.5">
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
      )}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        {!heading && <OnboardingBubble spans={bubble} tail="down" />}
        <OnboardingFox greet={greet} className="aspect-square h-[min(12rem,28dvh)] shrink" />
        {heading && <OnboardingBubble spans={bubble} tail="up" />}
      </div>

      <div className="w-full max-w-xs shrink-0 pb-4 sm:max-w-sm sm:pb-6">
        <Button3D onClick={onContinue} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
