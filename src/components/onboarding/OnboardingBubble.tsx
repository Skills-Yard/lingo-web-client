import type { TextSpan } from "@/lib/constants/onboarding";
import { DialogueBubble } from "@/components/ui/DialogueBubble";

interface OnboardingBubbleProps {
  spans: TextSpan[];
  /** "down" (tail points down, into a fox below the bubble) or "up" (tail
   * points up, into a fox above the bubble) — matches whichever of the two
   * bubble/fox arrangements the reference design uses for a given screen. */
  tail: "down" | "up";
  className?: string;
}

/**
 * A plain, static (no typewriter) speech bubble — the onboarding flow's own
 * lightweight version of instructions-intro's `SpeechBubble`, which this
 * flow doesn't reuse directly since it's wired to that flow's specific
 * mouth-sync/typewriter machinery (RobuTalkingContext) that doesn't apply
 * here (no persistent gliding mascot in this flow, just a per-screen fox).
 *
 * The shape itself (outline, flat shadow, tail) is the shared
 * `DialogueBubble`; this just gives it the onboarding flow's text styling and
 * pads the wrapper out to the tail's tip, so callers spacing this against a
 * fox (e.g. `gap-4`) measure to the tip rather than to the box.
 */
export function OnboardingBubble({ spans, tail, className }: OnboardingBubbleProps) {
  return (
    <DialogueBubble
      tail={tail}
      // The tail overhangs the wrapper on its own side (16px, hence pt-4/pb-4);
      // on the other side the flat shadow still spills 3px past the box, so
      // "up" gets that much room below too.
      className={`inline-block max-w-xs sm:max-w-sm ${
        tail === "up" ? "pt-4 pb-0.75" : "pb-4"
      } ${className ?? ""}`}
      contentClassName="whitespace-pre-line text-balance px-3 py-3 text-center text-base font-medium leading-tight text-black sm:px-6 sm:py-3.5"
    >
      {spans.map((span, i) => (
        <span key={i} className={span.highlight ? "text-primary" : undefined}>
          {span.text}
        </span>
      ))}
    </DialogueBubble>
  );
}
