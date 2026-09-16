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
  /** Overrides `side` from `lg:` up only — phones/tablets keep whatever
   * `side` says. "left"/"right" just flips which side Robu stands on once
   * there's more room. Leave unset to keep the same `side` arrangement at
   * every width. (Doesn't accept "above" — see `stacked` for that.) */
  sideLg?: "left" | "right";
  /** Stacks Robu *below* the text instead of beside it (text first, Robu
   * under it) at every width, not just once there's more room — for screens
   * whose heading reads better as a stand-alone line above him everywhere. */
  stacked?: boolean;
  /** Center the row instead of letting it hug the text width — for screens
   * whose heading is centered on mobile. */
  center?: boolean;
  /** Registers where Robu (a single persistent mascot — see RobuStage) should
   * stand for this screen. */
  registerAnchor: (el: HTMLDivElement | null) => void;
  robuClassName?: string;
  bubbleClassName?: string;
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
  sideLg,
  stacked = false,
  center = true,
  registerAnchor,
  robuClassName = ROBU_DEFAULT_SIZE,
  bubbleClassName,
  className,
  onTypingComplete,
  onTextTyped,
  audioSrc,
  speedMs,
}: RobuSaysProps) {
  const tailCorner = side === "left" ? "bottom-left" : "bottom-right";

  // `stacked` reverses to a column at every width, so the bubble (first in
  // the DOM) ends up on top and Robu (second) underneath it — unlike
  // `sideLg`, it isn't gated to `lg:`: a stacked heading reads fine at any
  // size for the screens that ask for it.
  const rowDirection = stacked
    ? "flex-col-reverse flex-nowrap items-center"
    : `flex-wrap items-center md:items-start ${side === "right" ? "flex-row-reverse" : ""}`;

  // `lg:` override of the row's own direction — moot once `stacked` already
  // applies the column layout at every width.
  const rowDirectionLg =
    !stacked && sideLg === "left"
      ? "lg:flex-row lg:flex-nowrap"
      : !stacked && sideLg === "right"
        ? "lg:flex-row-reverse lg:flex-nowrap"
        : "";

  return (
    <div
      // `pt`/`gap` below `md:` are tighter (phones get less breathing room
      // here) than from `md:` up, where the row reverts to its original,
      // more spaced-out values.
      className={`animate-fade-in flex w-full pt-0 justify-center gap-2 md:pt-2 md:gap-1 ${rowDirection} ${rowDirectionLg} ${className ?? ""}`}
    >
      <RobuAnchor
        registerAnchor={registerAnchor}
        className={`shrink-0 ${robuClassName}`}
      />
      <div
        // `min-w-0`, no grow (default `flex: 0 1 auto`, not `flex-auto`'s
        // `1 1 auto`): the bubble only needs to *shrink* below its own
        // max-width when the row sits inside a column narrower than that
        // (TeacherIntroScreen's left column, ExamplesGridScreen's `md:w-56`
        // row) — letting it grow too used to stretch this wrapper across
        // whatever space was left over on the line, stranding the actual
        // (`w-max`) bubble at its far edge, away from Robu (or, combined
        // with the pull-margin that used to compensate for that gap,
        // dragging it back the *other* way into overlapping him whenever
        // the row had little or no leftover space to begin with). The row's
        // own `gap-2`/`gap-1` is enough spacing now that this wrapper never
        // over-grows, so no pull-margin is needed either.
        className="min-w-0"
      >
        <SpeechBubble
          text={text}
          highlight={highlight}
          instant={instant}
          size="lg"
          tailCorner={tailCorner}
          bubbleClassName={bubbleClassName}
          onTypingComplete={onTypingComplete}
          onTextTyped={onTextTyped}
          audioSrc={audioSrc}
          speedMs={speedMs}
        />
      </div>
    </div>
  );
}
