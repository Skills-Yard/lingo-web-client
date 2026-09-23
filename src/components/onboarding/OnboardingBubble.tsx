import type { TextSpan } from "@/lib/constants/onboarding";

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
 * Colors are hardcoded light values (not the `bg-card`/`text-foreground`
 * theme tokens) — this flow is styled to match the reference design
 * exactly, which is light-only with no dark-mode treatment of its own, so
 * it shouldn't inherit the rest of the site's dark-by-default theme.
 */
export function OnboardingBubble({ spans, tail, className }: OnboardingBubbleProps) {
  return (
    <div className={`relative inline-flex ${className ?? ""}`}>
      <div className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-medium leading-snug shadow-sm sm:text-base">
        {spans.map((span, i) => (
          <span key={i} className={span.highlight ? "text-primary" : "text-[#1A1C22]"}>
            {span.text}
          </span>
        ))}
      </div>
      <span
        aria-hidden
        className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-black/10 bg-white ${
          tail === "down"
            ? "-bottom-1.5 border-b border-r"
            : "-top-1.5 border-l border-t"
        }`}
      />
    </div>
  );
}
