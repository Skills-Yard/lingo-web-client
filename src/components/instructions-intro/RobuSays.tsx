import { RobuAnchor, ROBU_DEFAULT_SIZE } from "./RobuAnchor";
import { SpeechBubble } from "./SpeechBubble";

interface RobuSaysProps {
  /** Line Robu speaks — usually the screen's own heading/question, moved
   * into his bubble instead of sitting on its own as a bare `<h1>`. */
  text: string;
  /** Substring of `text` highlighted in primary teal (mirrors each slide's
   * existing `highlightWord`). */
  highlight?: string;
  /** Skip the typewriter for a screen the learner has already visited. */
  instant?: boolean;
  /** Which side of the bubble Robu stands on — lets each screen place him
   * somewhere that actually fits its own layout instead of every screen
   * defaulting to the same corner. */
  side?: "left" | "right";
  /** Center the row instead of letting it hug the text width — for screens
   * whose heading is centered on mobile. */
  center?: boolean;
  /** Registers where Robu (a single persistent mascot — see RobuStage) should
   * stand for this screen. */
  registerAnchor: (el: HTMLDivElement | null) => void;
  robuClassName?: string;
  className?: string;
  /** "heading" (default) — this is a real page heading, styled bold and
   * plain like every other screen's, not a chat bubble. Pass "lg" for a
   * screen whose Robu line is short enough to stay an actual bubble instead
   * (e.g. RewardScreen's "CLAIM reward"). */
  size?: "heading" | "lg";
}

/**
 * Robu's anchor + speech bubble, reused across every screen so each one's
 * heading reads as something Robu is actually saying (see the cover
 * screens) instead of a bare title. `side` only changes which way the pair
 * faces — the mascot itself is a single shared instance (RobuStage) that
 * glides here from wherever it stood on the previous screen.
 */
export function RobuSays({
  text,
  highlight,
  instant,
  side = "left",
  center = true,
  registerAnchor,
  robuClassName = ROBU_DEFAULT_SIZE,
  className,
  size = "heading",
}: RobuSaysProps) {
  const tailCorner = side === "left" ? "bottom-left" : "bottom-right";

  return (
    <div
      className={`animate-fade-in flex w-full pt-2 items-start justify-center gap-1 ${
        side === "right" ? "flex-row-reverse" : ""
      } ${className ?? ""}`}
    >
      <RobuAnchor
        registerAnchor={registerAnchor}
        className={`shrink-0 ${robuClassName}`}
      />
      <div
        className={
          // The tight negative margin pulls a small chat bubble in close to
          // Robu — tuned for `size="lg"`'s bounded width. A `size="heading"`
          // line has no such cap (it just wraps within the row like any
          // other heading), so pulling it in by the same ~48px would shove
          // wide/multi-line text partly under Robu's own canvas instead.
          size === "lg"
            ? side === "right"
              ? "-mr-12 shrink-0 sm:-mr-4 md:mr-0"
              : "-ml-12 shrink-0 sm:-ml-4 md:ml-0"
            : "min-w-0"
        }
      >
        <SpeechBubble
          text={text}
          highlight={highlight}
          instant={instant}
          size={size}
          tailCorner={tailCorner}
        />
      </div>
    </div>
  );
}
