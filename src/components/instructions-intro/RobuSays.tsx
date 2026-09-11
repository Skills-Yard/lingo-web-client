import { RobuAnchor } from "./RobuAnchor";
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
}

const DEFAULT_ROBU_SIZE = "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20";

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
  robuClassName = DEFAULT_ROBU_SIZE,
  className,
}: RobuSaysProps) {
  const tailCorner = side === "left" ? "bottom-left" : "bottom-right";

  return (
    <div
      className={`animate-fade-in flex items-end gap-2.5 ${
        side === "right" ? "flex-row-reverse" : ""
      } ${center ? "justify-center md:justify-start" : ""} ${className ?? ""}`}
    >
      <RobuAnchor registerAnchor={registerAnchor} className={`shrink-0 ${robuClassName}`} />
      <SpeechBubble
        text={text}
        highlight={highlight}
        instant={instant}
        size="lg"
        tailCorner={tailCorner}
      />
    </div>
  );
}
