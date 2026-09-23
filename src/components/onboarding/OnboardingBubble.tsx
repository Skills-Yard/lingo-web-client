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
 * The border/gradient/tail is the actual `dialogue-box.png` design asset
 * (290x111, tail pointing down) rather than a hand-built CSS+SVG
 * reconstruction of it — earlier attempts at reproducing this exact shape
 * (rounded border, flat drop-shadow, gradient notch) kept drifting from the
 * source design in small ways. It's stretched to the text's own box via
 * `background-size: 100% 100%` rather than tiled/sliced — at the padding
 * below (chosen to roughly track the source image's own ~2.6:1 aspect
 * ratio for 2-3 lines of text) that stays close to undistorted; it only
 * visibly stretches for much longer or shorter lines than this was sized
 * for.
 *
 * For `tail="up"`, only the *image* flips (`scale-y-[-1]` on its own layer,
 * not the whole bubble) — the text stays upright, with its own padding
 * swapped top/bottom so it still sits inside the rounded box and clear of
 * the tail, which is now at the top instead of the bottom.
 */
export function OnboardingBubble({ spans, tail, className }: OnboardingBubbleProps) {
  return (
    <div className={`relative inline-flex ${className ?? ""}`}>
      <div
        aria-hidden
        className={`absolute inset-0 bg-[url(/images/dialogue-box.png)] bg-size-[100%_100%] bg-no-repeat ${
          tail === "up" ? "scale-y-[-1]" : ""
        }`}
      />
      <div
        className={`relative px-9 text-center text-base font-medium leading-tight text-black sm:px-10 ${
          tail === "down" ? "pt-6 pb-11 sm:pt-7" : "pt-11 pb-6 sm:pb-7"
        }`}
      >
        {spans.map((span, i) => (
          <span key={i} className={span.highlight ? "text-primary" : undefined}>
            {span.text}
          </span>
        ))}
      </div>
    </div>
  );
}
