"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type {
  OnboardingGridOption,
  OnboardingListOption,
  QuestionHexMode,
  TextSpan,
} from "@/lib/constants/onboarding";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { QuestionHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";
import { QuestionListOptions } from "./QuestionListScreen";
import { QuestionGridOptions } from "./QuestionGridScreen";
import { ReactionsHex } from "./robu/ReactionsHex";

type QuestionScreenProps = {
  /** Changes with each question; the options fade in anew when it does. */
  questionId: string;
  heading: TextSpan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Question (then options) voiceover, played as the screen appears. */
  voiceover?: readonly string[];
  muted?: boolean;
  /** How Zox reacts — see OnboardingStep's `hexMode`. */
  hexMode?: QuestionHexMode;
  className?: string;
} & (
  | { kind: "question-list"; options: OnboardingListOption[] }
  | { kind: "question-grid"; options: OnboardingGridOption[] }
);

/**
 * Every question screen — list or grid. One component for both, rendered at
 * the same spot for every question, so going from one question to the next
 * keeps Zox (and his idle loop) exactly where he is: only the heading text
 * and the options change.
 *
 * The fox beside the question talks exactly while its voice plays; the
 * question fills in as it's read, then each option lights up (selected look
 * + slight scale-up, never actually selected) as it's read out. Picking
 * an answer cuts all that short — the voice fades out and the highlighting
 * stops. Each pick also has Zox look at his tablet and type, and each new
 * question has him look back up at the user (see ZoxTabFox).
 */
export function QuestionScreen(props: QuestionScreenProps) {
  const { questionId, heading, selectedId, onSelect, voiceover, muted = false, hexMode, className } =
    props;

  const voice = useVoiceover(voiceover, true, muted, selectedId !== null);
  const spokenQuestion = questionSpoken(voice, !!voiceover?.length);
  const spokenOption = spokenOptionIndex(voice, props.options.length);

  const [typing, setTyping] = useState(0);
  // 1-based, as the reactions artboard numbers its options; 0 for none.
  const selectedOption = props.options.findIndex((option) => option.id === selectedId) + 1;

  const pick = (id: string) => {
    voice.stop();
    playClickSound();
    setTyping(Date.now());
    onSelect(id);
  };

  return (
    <div className={`flex min-h-0 flex-col bg-white px-4 dark:bg-background ${className ?? ""}`}>
      <QuestionHeading
        heading={heading}
        spoken={spokenQuestion}
        talking={voice.playing}
        typing={typing}
        screenId={questionId}
        showFox={!hexMode}
      />

      {hexMode === "reactions" && (
        <ReactionsHex
          className="mx-auto aspect-[390/171] w-full max-w-[24rem] shrink-0"
          typing={typing}
          selectedOption={selectedOption}
        />
      )}

      <motion.div
        key={questionId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {props.kind === "question-list" ? (
          <QuestionListOptions
            options={props.options}
            selectedId={selectedId}
            spokenOption={spokenOption}
            onPick={pick}
          />
        ) : (
          <QuestionGridOptions
            options={props.options}
            selectedId={selectedId}
            spokenOption={spokenOption}
            onPick={pick}
          />
        )}
      </motion.div>
    </div>
  );
}
