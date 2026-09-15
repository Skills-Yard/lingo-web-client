import {
  RobuAnchor,
  ROBU_DEFAULT_SIZE,
  ROBU_TRAILING_GAP_PULL,
} from "./RobuAnchor";
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
  /** Forwarded straight to SpeechBubble — fires once Robu's line is fully
   * shown (immediately for `instant`, otherwise on the typewriter's/audio's
   * own completion). Lets a caller react to "Robu's done talking", e.g.
   * highlighting something else on screen only once he's finished saying it. */
  onTypingComplete?: () => void;
  /** Forwarded straight to SpeechBubble — fires as soon as Robu's line
   * finishes *appearing*, even for a voiced line whose audio is still
   * playing. Use this (not `onTypingComplete`) for a caller that should
   * react to the text animation alone, not the voice line. */
  onTextTyped?: () => void;
  /** "heading" (default) — this is a real page heading, styled bold and
   * plain like every other screen's, not a chat bubble. Pass "lg" for a
   * screen whose Robu line is short enough to stay an actual bubble instead
   * (e.g. RewardScreen's "CLAIM reward"). */
  size?: "heading" | "lg";
  /** This screen's own voice line for this text, forwarded straight to
   * SpeechBubble — see its own `audioSrc` doc for the sync behavior. Each
   * call site passes its own screen's file; there's no shared default here
   * since playing another screen's line would be wrong for every screen but
   * one. */
  audioSrc?: string;
  /** Forwarded straight to SpeechBubble's own `speedMs` — pass a smaller
   * number to type this screen's line faster, or a larger one to slow it
   * down. Independent of `audioSrc`: it never stretches to match a voice
   * line's length (see SpeechBubble's doc for why). */
  speedMs?: number;
  /** Forwarded straight to SpeechBubble's own `onTypingComplete` — fires
   * once this line is fully "said": right away for a revisit (`instant`),
   * on the last typed character for a plain line, or on the voice line's
   * own "ended" event when `audioSrc` is set. Lets a caller chain something
   * onto "Robu just finished saying this" (e.g. TeacherQuizScreen narrating
   * its options right after the heading is voiced). */
  onTypingComplete?: () => void;
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
  audioSrc,
  speedMs,
  onTypingComplete,
}: RobuSaysProps) {
  const tailCorner = side === "left" ? "bottom-left" : "bottom-right";

  return (
    <div
      // `flex-wrap` only for `size="lg"` (+ centered on every line): at
      // Robu's shared default size, Robu + a bounded `size="lg"` bubble
      // don't reliably fit side by side on a narrow phone — instead of
      // shrinking Robu just for this screen (breaking the "same size
      // everywhere" the mascot's going for) or letting the bubble run off
      // the edge, the bubble simply drops to its own line underneath him
      // when there isn't room beside him. A `size="heading"` line has no
      // such bound — it already wraps its own text within the row (see
      // that branch below) — so forcing the same flex-wrap here would drop
      // the *whole row* (Robu included) onto its own centered line instead
      // of just letting the heading wrap in place beside him.
      className={`animate-fade-in flex w-full pt-0 items-center justify-center gap-2 ${
        size === "lg" ? "flex-wrap" : ""
      } ${side === "right" ? "flex-row-reverse" : ""} ${className ?? ""}`}
    >
      <RobuAnchor
        registerAnchor={registerAnchor}
        className={`shrink-0 ${robuClassName}`}
      />
      <div
        className={`pb-6
          ${
            size === "lg"
              ? // The tight negative margin pulls a small chat bubble in close
                // to Robu — tuned for `size="lg"`'s bounded width.
                side === "right"
                ? "-mr-12 shrink-0 sm:-mr-4 md:mr-0"
                : "-ml-12 shrink-0 sm:-ml-4 md:ml-0"
              : side === "right"
                ? // Untuned for `side="right"` (no screen uses it today) —
                  // kept as the pre-existing no-pull fallback rather than
                  // guessing a mirrored offset against unverified layout.
                  "min-w-0"
                : // `size="heading"` has no bounded width (it just wraps its
                  // own text within the row, see below), but Robu's own
                  // Rive artwork sits well inside its square anchor box —
                  // see ROBU_TRAILING_GAP_PULL's own comment — leaving a big
                  // dead strip between him and this text unless pulled in.
                  `min-w-0 ${ROBU_TRAILING_GAP_PULL}`
          }
        `}
      >
        <SpeechBubble
          text={text}
          highlight={highlight}
          instant={instant}
          size={size}
          tailCorner={tailCorner}
          audioSrc={audioSrc}
          speedMs={speedMs}
          onTypingComplete={onTypingComplete}
        />
      </div>
    </div>
  );
}
