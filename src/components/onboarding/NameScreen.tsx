"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DialogueBubble } from "@/components/ui/DialogueBubble";
import { FoxSlot } from "./foxStage";
import { ONBOARDING_TEXT_CLASS, ONBOARDING_TOP_OFFSET_CLASS } from "./headingStyle";
import { KaraokeSpans, questionSpoken } from "./QuestionHeading";
import { useVoiceover, useVoiceoverGate } from "./useVoiceover";

interface NameScreenProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  /** Enter on the keyboard — moves on when there's a name. */
  onSubmit: () => void;
  /** Read out as the screen appears; the prompt fills in with it. */
  voiceover?: readonly string[];
  /** Called once the voiceover has finished (or failed to play). */
  onVoiceoverDone?: () => void;
  /** Bumped by the Skip link: cuts the voice off. */
  skipCount?: number;
  muted?: boolean;
  className?: string;
}

/** Wait for the screen's crossfade before raising the keyboard. */
const FOCUS_DELAY_MS = 450;

/** Hex's size — the same as on every bubble screen (FoxMessageScreen). */
const FOX_SIZE = "min(12.5rem, 25dvh)";

/**
 * "What should I call you?": the question sits in Zox's speech bubble, with
 * the text field as the bubble's second line (a dashed underline, as in the
 * reference), and Zox below it. The field takes focus on arrival so the
 * keyboard opens straight away.
 */
export function NameScreen({
  prompt,
  value,
  onChange,
  onSubmit,
  voiceover,
  onVoiceoverDone,
  skipCount = 0,
  muted = false,
  className,
}: NameScreenProps) {
  const voice = useVoiceover(voiceover, true, muted);
  useVoiceoverGate(voice, onVoiceoverDone, skipCount);
  const spoken = questionSpoken(voice, !!voiceover?.length);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Browser autofill (the blue field) can fill the input without a React
  // change event, which left "Continue" disabled with a name showing. So the
  // DOM value is checked against the state until the user leaves.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const timer = window.setInterval(() => {
      const typed = inputRef.current?.value ?? "";
      if (typed !== valueRef.current) onChangeRef.current(typed);
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`flex min-h-0 flex-col items-center px-6 ${ONBOARDING_TOP_OFFSET_CLASS} ${className ?? ""}`}>
      {/* Same layout as the other bubble screens: Hex centred, the bubble's
        top edge 146px from the top of the screen (the
        header is 107px), growing downward. */}
      <div className="relative min-h-0 w-full flex-1">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="absolute left-1/2 z-10 w-max -translate-x-1/2"
        style={{ top: 39 }}
      >
        <DialogueBubble
          tail="down"
          className="w-[min(17rem,calc(100vw-3rem))] pb-4 [--bubble-fill:var(--background)]"
          contentClassName={`flex flex-col items-center gap-2 px-4 py-3 ${ONBOARDING_TEXT_CLASS}`}
        >
          <label htmlFor="onboarding-name" className="text-center">
            <KaraokeSpans spans={[{ text: prompt }]} spoken={spoken} />
          </label>
          <input
            id="onboarding-name"
            ref={inputRef}
            type="text"
            value={value}
            maxLength={30}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            enterKeyHint="done"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) onSubmit();
            }}
            className={`w-full border-0 border-b border-dashed border-primary bg-transparent pb-1 text-center caret-primary outline-none ${ONBOARDING_TEXT_CLASS}`}
          />
        </DialogueBubble>
      </motion.div>

        <FoxSlot
          beat="showQuestion"
          beatDue
          fullWidth
          talking={voice.playing && spoken < 1}
          className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
          style={{ height: FOX_SIZE }}
        />
      </div>
    </div>
  );
}
