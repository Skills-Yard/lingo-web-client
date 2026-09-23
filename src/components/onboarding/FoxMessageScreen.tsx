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
        <div className="relative mt-[8vh] flex items-start gap-1.5">
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

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {!heading && <OnboardingBubble spans={bubble} tail="down" />}
        <OnboardingFox greet={greet} className="h-40 w-40 sm:h-48 sm:w-48" />
        {heading && <OnboardingBubble spans={bubble} tail="up" />}
      </div>

      <div className="w-full max-w-xs pb-6 sm:max-w-sm">
        <Button3D onClick={onContinue} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
