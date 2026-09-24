"use client";

import { useEffect, useState } from "react";
import { DialogueBubble } from "@/components/ui/DialogueBubble";

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
   * reusing the exact same typewriter behavior. */
  size?: "sm" | "lg" | "heading";
  className?: string;
}

/** How long each character takes to appear, in ms. */
const TYPE_SPEED_MS = 40;

/** Corner radius (px) of the `sm`/`lg` bubbles — tighter than
 * `DialogueBubble`'s default, to suit their small text and tight padding. */
const BUBBLE_RADIUS_SM = 12;
const BUBBLE_RADIUS_LG = 14;
const CHARS_PER_TICK = 3;


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

  useEffect(() => {
    if (!text || skipTyping) return;

    let i = 0;

    const timer = window.setInterval(() => {
      i += CHARS_PER_TICK;
      setShown(text.slice(0, i));

      if (i >= text.length) {
        window.clearInterval(timer);
      }
    }, TYPE_SPEED_MS);

    return () => window.clearInterval(timer);
  }, [text, skipTyping]);

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

  const bubbleWidth = size === "lg" ? "max-w-[72vw] sm:max-w-72" : "max-w-[58vw] sm:max-w-56";
  const bubblePadding =
    size === "lg" ? "px-3 py-1.5 sm:px-3.5 sm:py-2" : "px-2.5 py-1 sm:px-3 sm:py-1.5";
  const textSize =
    size === "lg" ? "text-sm sm:text-base" : "text-[13px] sm:text-sm";

  return (
    <DialogueBubble
      tail={tailCorner === "top-right" ? "up" : "down"}
      tailAlign={tailCorner === "bottom-left" ? "left" : "right"}
      radius={size === "lg" ? BUBBLE_RADIUS_LG : BUBBLE_RADIUS_SM}
      className={`animate-pop-in w-max dark:[--bubble-fill:#12141A] ${bubbleWidth} ${className ?? ""}`}
      contentClassName={bubblePadding}
    >
      <p
        className={`font-semibold leading-snug text-[#2C2C2C] dark:text-white ${textSize}`}
      >
        {renderTyped(shown, text, highlight)}
        {stillTyping && (
          <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-primary align-middle" />
        )}
      </p>
    </DialogueBubble>
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
