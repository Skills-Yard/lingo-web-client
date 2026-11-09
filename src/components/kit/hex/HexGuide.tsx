"use client";

import { HexBubble } from "@/components/level-two/HexBubble";
import { plainText, toSpans } from "../markup";

export type HexGuideProps = {
  /** Hex's line: short (about 60 letters, up to 100). `*words*` in teal. */
  text: string;
  /** Where Hex stands; the bubble's tail points back at him. */
  hex?: "left" | "right" | "top";
  /** The bubble's width (px). By default it follows the length of the line. */
  width?: number;
  /** A new key plays his entrance again (default: the line itself). */
  entryKey?: string;
  /** A trigger Hex plays once he has entered. */
  cue?: string | null;
  /** The bubble and then Hex bounce off to the left (the result sheet brings its own Hex). */
  leaving?: boolean;
  /** Called once, when the whole line has been said — typed in, or read out by the voiceover. */
  onSpoken?: () => void;
};

/** How wide the bubble is, by how long the line is. */
const widthFor = (line: string) => (line.length <= 50 ? 190 : line.length <= 90 ? 240 : 262);

/**
 * Hex with his line in a speech bubble. The line types in letter by letter, or in
 * step with the screen's voiceover when there is one (see `Voiceover`).
 */
export function HexGuide({ text, hex = "left", width, entryKey, cue, leaving, onSpoken }: HexGuideProps) {
  const line = plainText(text);
  return <HexBubble key={text} entryKey={entryKey ?? `kit-${text}`} hex={hex} line={toSpans(text)} size={{ width: width ?? widthFor(line) }} cue={cue} leaving={leaving} onSpoken={onSpoken} />;
}
