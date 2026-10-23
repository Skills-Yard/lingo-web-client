"use client";

import type { TextSpan } from "@/lib/constants/onboarding";
import { KaraokeSpans } from "@/components/onboarding/QuestionHeading";
import { useLevelVoice } from "./LevelVoice";

/** When each word of a heading is spoken: seconds into the clip, start and end. */
export type WordTimes = readonly (readonly [start: number, end: number])[];

type Timing = {
  /** Length of the clip, to turn its 0..1 progress into seconds. */
  clipSeconds: number;
  /** The whole heading's words, in order. */
  times: WordTimes;
  /** How many of those words come before this text (it may be one line of several). */
  before: number;
};

/** Each word with the space after it, so a word's letters and its gap fill together. */
const wordLengths = (spans: TextSpan[]) =>
  spans.map((span) => span.text).join("").split(/(?<=\s)/).map((word) => word.length);

/** The share of `spans` spoken `seconds` into the clip, letter by letter inside each word's own time. */
const timedSpoken = (spans: TextSpan[], { times, before }: Timing, seconds: number) => {
  const lengths = wordLengths(spans);
  const all = lengths.reduce((sum, length) => sum + length, 0);
  const chars = lengths.reduce((sum, length, i) => {
    const [start, end] = times[before + i] ?? [Infinity, Infinity];
    const done = Math.min(1, Math.max(0, (seconds - start) / (end - start)));
    return sum + Math.ceil(done * length);
  }, 0);
  return chars >= all ? 1 : (chars + 0.5) / all;
};

/**
 * A heading that fills in as the screen's voiceover reads it, like the
 * onboarding questions: the part already spoken at full strength (teal words in
 * the Level 1 gradient), the rest faded. `from`/`to` (0..1) is the slice of the
 * clip this text covers, for a heading split over several lines. With `timing`
 * each word fills letter by letter over the time it is spoken instead.
 */
export function SpokenText({ spans, from = 0, to = 1, timing }: { spans: TextSpan[]; from?: number; to?: number; timing?: Timing }) {
  const { spoken } = useLevelVoice();
  if (timing) {
    // No voice, a failed one or a finished one counts as fully read.
    return <KaraokeSpans spans={spans} highlightClass="text-level-gradient" spoken={spoken >= 1 ? 1 : timedSpoken(spans, timing, spoken * timing.clipSeconds)} />;
  }
  const local = spoken >= to ? 1 : Math.max(0, (spoken - from) / (to - from));
  return <KaraokeSpans spans={spans} highlightClass="text-level-gradient" spoken={local} />;
}
