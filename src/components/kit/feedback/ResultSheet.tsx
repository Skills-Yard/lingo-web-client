"use client";

import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { Markup } from "../markup";

export type ResultSheetProps = {
  /** Right (green, "Correct!") or wrong (red, "Not quite"). The same sheet either way; only the colours and Hex's reaction change. */
  correct: boolean;
  /** The sheet is up. It stays mounted while closed, so Hex is loaded when it opens. */
  open: boolean;
  /** In place of the usual "Correct!" / "Not quite". */
  title?: string;
  /** The sentence under the title; `**bold**` words are picked out. */
  text: string;
  /** Hex and the words as one centred group (the module screens' sheet) instead of the text at the left. */
  centred?: boolean;
  /** A trigger Hex plays on a right answer (default his thumbs-up). */
  hexCue?: string | null;
  /** Makes the sheet take taps ("tap to try again"). */
  onPress?: () => void;
};

/**
 * The sheet that slides up from the bottom of the screen behind the main button once an answer is
 * checked: the verdict, what to learn from it, and Hex. One component for right and wrong. It is laid
 * over the whole screen, so put it in the frame's `overlay` (or in any positioned box).
 */
export function ResultSheet({ correct, open, title, text, centred = true, hexCue, onPress }: ResultSheetProps) {
  const tappable = !!onPress && open;
  return (
    <div className={`absolute inset-0 ${tappable ? "z-[9] [&>*]:pointer-events-auto" : "pointer-events-none"}`} onClick={tappable ? onPress : undefined}>
      <FeedbackPanel correct={correct} title={title} open={open} hexIn={open} hexCue={hexCue === undefined ? (correct ? HEX_ONBOARDING_TRIGGER.continueThumb : null) : hexCue} centred={centred}>
        <Markup text={text} />
      </FeedbackPanel>
    </div>
  );
}
