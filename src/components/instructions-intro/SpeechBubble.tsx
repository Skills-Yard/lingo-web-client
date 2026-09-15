"use client";

import { useEffect, useState } from "react";
import { useRobuTalking } from "./RobuTalkingContext";

interface SpeechBubbleProps {
  /** Line Robu "types" out, one character at a time. */
  text: string;
  /** Substring of `text` to highlight in primary teal once it's typed. */
  highlight?: string;
  /** Which corner the tail sprouts from, pointing toward Robu. */
  tailCorner?: "bottom-right" | "top-right" | "bottom-left";
  /** Skip the typewriter and show the full line immediately. Read once at
   * mount and frozen for this instance's whole life — a later change to this
   * prop (e.g. a slide getting marked "seen" mid-visit) never interrupts a
   * typing animation already under way. Used for slides being revisited so
   * Robu doesn't re-type a line the learner already read. */
  instant?: boolean;
  /** "sm" (default) matches the original cover-screen bubbles; "lg" is sized
   * for screens where the bubble carries the whole heading. "heading" drops
   * the bubble chrome (border/background/tail) entirely and renders the
   * same typed/highlighted text as a big bold heading instead — for a
   * moment that wants to read as a headline, not a chat bubble, while still
   * reusing the exact same typewriter behavior. "plain" drops the chrome
   * *and* the heading's own font sizing — just the typed characters and
   * cursor, inline, so a caller can drop this into a slot that already has
   * its own text styling (e.g. a note card's own heading) and still get the
   * same typewriter behavior. */
  size?: "sm" | "lg" | "heading" | "plain";
  className?: string;
  /** Fired once the full line is showing — right away for `instant`, or the
   * moment the typewriter reaches the last character otherwise. Lets a
   * caller auto-advance the instant Robu "finishes talking" instead of
   * gating that on a separate manual step. */
  onTypingComplete?: () => void;
  /** Fired the moment the typed characters themselves reach the end of the
   * line — for a voiced (`audioSrc`) bubble this fires well before
   * `onTypingComplete` (which waits for the audio's "ended" event), so a
   * caller that wants to react to "the text is done appearing" rather than
   * "the voice line is done playing" should use this instead. For a
   * non-voiced or `instant` bubble it fires at the same moment as
   * `onTypingComplete`. */
  onTextTyped?: () => void;
  /** When set, this line is voiced: the audio starts playing the moment this
   * bubble mounts, the typewriter is re-paced to land its last character
   * exactly when the audio ends (instead of the fixed `TYPE_SPEED_MS`), and
   * `onTypingComplete` fires on the audio's own "ended" event rather than on
   * the last character — so a caller gating an auto-advance on it (see
   * CoverScreen's screen 2) holds until the voice line has actually finished
   * playing, not just once the text has finished appearing. Ignored for
   * `instant` bubbles (a revisit never replays the line). Falls back to the
   * plain character-paced typewriter — completing on the last character, no
   * audio — if the asset fails to load or autoplay is blocked, so this never
   * strands the caller waiting on an "ended" event that'll never fire. */
  audioSrc?: string;
}

/** How long each character takes to appear, in ms — the default pace, and
 * also the fallback pace for a voiced (`audioSrc`) bubble whose audio can't
 * play. */
const TYPE_SPEED_MS = 50;

/**
 * A small talk bubble that types `text` out character by character, cursor and
 * all. Mount it fresh (e.g. `key={text}`) wherever the line can change while
 * the bubble stays on screen, so the typing restarts from the top.
 */
export function SpeechBubble({
  text,
  highlight,
  tailCorner = "bottom-right",
  instant = false,
  size = "sm",
  className,
  onTypingComplete,
  onTextTyped,
  audioSrc,
}: SpeechBubbleProps) {
  // Frozen at mount on purpose (see `instant` doc above) — this bubble either
  // types or doesn't for its whole life, never switching mid-animation.
  const [skipTyping] = useState(instant);
  // Instant mode's full text is set right here, synchronously, so there's
  // nothing left for the effect below to do for it (avoids a setState-in-effect
  // render round-trip for a value already known at construction time).
  const [shown, setShown] = useState(() => (skipTyping ? text : ""));
  // Derived rather than tracked as its own state: "still typing" is just
  // "haven't caught up to the full line yet", true for skipTyping too since
  // `shown` already starts out equal to `text` in that case.
  const stillTyping = shown.length < text.length;
  const { startTalking, stopTalking } = useRobuTalking();

  useEffect(() => {
    if (!text) return;
    if (skipTyping) {
      // Already showing the full line as of mount — still notify a caller
      // waiting on "Robu's done talking" instead of leaving it to fire only
      // for the animated case. Nothing is actually animating here, so Robu's
      // mouth is never cued for this instance (see `talkingStarted` below).
      onTextTyped?.();
      onTypingComplete?.();
      return;
    }

    let cancelled = false;
    let charTimer: number | undefined;
    // Tracks whether *this* effect run is the one currently holding Robu's
    // mouth open, so cleanup only ever closes it once and never double-counts
    // against `RobuTalkingContext`'s ref count.
    let talkingStarted = false;
    const beginTalking = () => {
      if (talkingStarted) return;
      talkingStarted = true;
      startTalking();
    };
    const endTalking = () => {
      if (!talkingStarted) return;
      talkingStarted = false;
      stopTalking();
    };

    // Runs the typewriter to completion over `durationMs`, then calls
    // `onDone` — shared by both the plain and audio-synced paths below so
    // there's exactly one place pacing `shown`. Cues Robu's talking-mouth
    // overlay for exactly the span this line is actually animating.
    const typeOver = (durationMs: number, onDone: () => void) => {
      beginTalking();
      const perCharMs = Math.max(durationMs / text.length, 10);
      let i = 0;
      charTimer = window.setInterval(() => {
        if (cancelled) return;
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(charTimer);
          endTalking();
          onDone();
        }
      }, perCharMs);
    };

    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.preload = "auto";
      let started = false;
      let fallbackTimer: number | undefined;

      // Paces the typewriter to the audio's real duration once it's known,
      // so the last character lands right as the line finishes playing.
      const begin = () => {
        if (started || cancelled) return;
        started = true;
        const durationMs =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : text.length * TYPE_SPEED_MS;
        // `onTextTyped` fires here, as soon as the characters themselves
        // catch up — independent of `onTypingComplete` below, which still
        // waits for the audio's own "ended" event.
        typeOver(durationMs, () => onTextTyped?.());
        // Safety net, mirroring the flow's own Robu-intro fallback: if the
        // audio stalls and its "ended" event never fires, don't strand the
        // caller waiting on it forever.
        fallbackTimer = window.setTimeout(() => {
          if (!cancelled) onTypingComplete?.();
        }, durationMs + 3000);
      };
      // The typewriter's own completion is *not* what signals "done talking"
      // here — the audio's "ended" event is, so a caller gating an
      // auto-advance on this (see CoverScreen's screen 2) holds for the
      // whole voice line, not just until the text catches up to it.
      const onEnded = () => {
        if (cancelled) return;
        window.clearInterval(charTimer);
        window.clearTimeout(fallbackTimer);
        setShown(text);
        endTalking();
        onTypingComplete?.();
      };
      // Asset missing/unsupported, or autoplay blocked — fall back to the
      // plain, silent typewriter instead of never calling onTypingComplete.
      const onUnplayable = () => {
        if (started || cancelled) return;
        started = true;
        typeOver(text.length * TYPE_SPEED_MS, () => {
          onTextTyped?.();
          onTypingComplete?.();
        });
      };

      audio.addEventListener("loadedmetadata", begin);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onUnplayable);
      audio.play().then(begin).catch(onUnplayable);

      return () => {
        cancelled = true;
        window.clearInterval(charTimer);
        window.clearTimeout(fallbackTimer);
        endTalking();
        audio.pause();
        audio.removeEventListener("loadedmetadata", begin);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onUnplayable);
      };
    }

    typeOver(text.length * TYPE_SPEED_MS, () => {
      onTextTyped?.();
      onTypingComplete?.();
    });
    return () => {
      cancelled = true;
      window.clearInterval(charTimer);
      endTalking();
    };
    // onTypingComplete/onTextTyped intentionally excluded — callers pass a
    // fresh inline function each render, and this typewriter should only
    // ever run once per (text, skipTyping, audioSrc) pair, not restart
    // because that identity changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, skipTyping, audioSrc]);

  if (size === "plain") {
    return (
      <>
        {renderTyped(shown, text, highlight)}
        {stillTyping && (
          <span className="ml-0.5 inline-block h-[0.9em] w-0.5 animate-pulse bg-primary align-middle" />
        )}
      </>
    );
  }

  if (size === "heading") {
    return (
      <p
        className={`animate-pop-in text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl ${className ?? ""}`}
      >
        {renderTyped(shown, text, highlight)}
        {stillTyping && (
          <span className="ml-0.5 inline-block h-[0.9em] w-0.5 animate-pulse bg-primary align-middle" />
        )}
      </p>
    );
  }

  const bubbleSize =
    size === "lg"
      ? "max-w-[72vw] px-4 py-2.5 sm:max-w-72 sm:px-5 sm:py-3"
      : "max-w-[58vw] px-3.5 py-2 sm:max-w-56 sm:px-4 sm:py-2.5";
  const textSize = size === "lg" ? "text-sm sm:text-base" : "text-[13px] sm:text-sm";

  return (
    <div
      className={`animate-pop-in relative w-max rounded-2xl border border-primary/50 bg-white shadow-lg dark:bg-[#12141A] ${bubbleSize} ${className ?? ""}`}
    >
      <p className={`font-semibold leading-snug text-[#2C2C2C] dark:text-white ${textSize}`}>
        {renderTyped(shown, text, highlight)}
        {stillTyping && (
          <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-primary align-middle" />
        )}
      </p>
      <span
        aria-hidden
        className={`absolute h-3 w-3 rotate-45 border-primary/50 bg-white dark:bg-[#12141A] ${
          tailCorner === "bottom-right"
            ? "-bottom-1.5 right-6 border-b border-r"
            : tailCorner === "bottom-left"
              ? "-bottom-1.5 left-6 border-b border-l"
              : "-top-1.5 right-6 border-t border-l"
        }`}
      />
    </div>
  );
}

/** Wraps the portion of `shown` that overlaps `highlight` (once typed that far) in primary teal. */
function renderTyped(shown: string, fullText: string, highlight?: string) {
  if (!highlight) return shown;
  const start = fullText.indexOf(highlight);
  if (start === -1) return shown;
  const end = start + highlight.length;

  const before = shown.slice(0, start);
  const within = shown.slice(start, end);
  const after = shown.slice(end);

  return (
    <>
      {before}
      <span className="text-primary">{within}</span>
      {after}
    </>
  );
}
