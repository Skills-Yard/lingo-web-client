"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { AnimatePresence, motion } from "framer-motion";
import type {
  OnboardingGridOption,
  OnboardingListOption,
  TextSpan,
} from "@/lib/constants/onboarding";
import { playClickSound } from "./clickSound";
import { useVoiceover } from "./useVoiceover";
import { QuestionHeading, QuestionTilesHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";
import { QuestionListOptions } from "./QuestionListScreen";
import { ZoxTabFox } from "./robu/ZoxTabFox";
import { QuestionGridOptions } from "./QuestionGridScreen";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600"] });

type QuestionScreenProps = {
  /** Changes with each question; the options fade in anew when it does. */
  questionId: string;
  heading: TextSpan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Question (then options) voiceover, played as the screen appears. */
  voiceover?: readonly string[];
  muted?: boolean;
  /** "row": Zox beside the heading — see QuestionHeading. */
  zoxLayout?: "row";
  className?: string;
} & (
  | { kind: "question-list"; options: OnboardingListOption[]; variant?: "tiles" }
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
  const { questionId, heading, selectedId, onSelect, voiceover, muted = false, className } = props;

  const voice = useVoiceover(voiceover, true, muted, selectedId !== null);
  const spokenQuestion = questionSpoken(voice, !!voiceover?.length);
  const spokenOption = spokenOptionIndex(voice, props.options.length);

  const tiles = props.kind === "question-list" && props.variant === "tiles";
  const picked =
    props.kind === "question-list" && props.variant === "tiles"
      ? props.options.find((o) => o.id === selectedId && o.description)
      : undefined;
  const [typing, setTyping] = useState(0);

  const pick = (id: string) => {
    voice.stop();
    playClickSound();
    setTyping(Date.now());
    onSelect(id);
  };

  return (
    <div className={`flex min-h-0 flex-col bg-white px-4 dark:bg-background ${className ?? ""}`}>
      {tiles ? (
        <QuestionTilesHeading heading={heading} spoken={spokenQuestion} />
      ) : (
        <QuestionHeading
          heading={heading}
          spoken={spokenQuestion}
          talking={voice.playing}
          typing={typing}
          screenId={questionId}
          layout={props.zoxLayout === "row" ? "row" : "stacked"}
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
            variant={props.variant}
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

      {/* Tiles variant: Zox says what the picked option is about. */}
      <AnimatePresence>
        {picked && (
          <motion.div
            key="pick-info"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="-mx-4 flex shrink-0 items-start justify-center gap-4 rounded-2xl border-[3px] border-white bg-[linear-gradient(263.69deg,#E6F8F8_4.33%,#FFFFFF_100.87%)] px-3 pt-4 pb-3 shadow-[1px_1px_14.3px_2px_rgba(0,184,169,0.33)] dark:border-white/10 dark:bg-none dark:bg-[#0F2921]"
          >
            <ZoxTabFox
              className="h-[100px] w-[137px] shrink-0"
              typing={typing}
              screenId={questionId}
            />
            <div className={`${poppins.className} flex w-[190px] min-w-0 flex-col justify-center gap-1.5`}>
              <p className="text-[20px] font-semibold leading-[1.34] text-[#2C2C2C] dark:text-white">
                {picked.label}
              </p>
              <p className="text-[14px] font-medium leading-[1.34] text-[#666666] dark:text-white/65">
                {picked.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
