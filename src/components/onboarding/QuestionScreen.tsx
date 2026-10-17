"use client";

import { useEffect, useRef, useState } from "react";
import type {
  OnboardingGridOption,
  OnboardingListOption,
  QuestionHexMode,
  TextSpan,
} from "@/lib/constants/onboarding";
import { playClickSound } from "./clickSound";
import { isVoiceoverSettled, useVoiceover } from "./useVoiceover";
import { QuestionHeading, questionSpoken, spokenOptionIndex } from "./QuestionHeading";
import { QuestionListOptions } from "./QuestionListScreen";
import { QuestionGridOptions } from "./QuestionGridScreen";
import { ReactionsHex } from "./robu/ReactionsHex";
import { DayNightHex } from "./robu/DayNightHex";
import { DAYNIGHT_ARTBOARD } from "@/lib/rive/runtime";

type QuestionScreenProps = {
  /** Changes with each question; the options fade in anew when it does. */
  questionId: string;
  heading: TextSpan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Question (then options) voiceover, played as the screen appears. */
  voiceover?: readonly string[];
  /** Called once the voiceover has finished (or failed to play). */
  onVoiceoverDone?: () => void;
  /** Bumped by the parent's Skip link: cuts the voice off and shows the
   * question and options as read. */
  skipCount?: number;
  muted?: boolean;
  /** How Zox reacts — see OnboardingStep's `hexMode`. */
  hexMode?: QuestionHexMode;
  /** Artboard for `hexMode: "reactions"` — defaults to the first one. */
  reactionsArtboard?: string;
  /** State machine of that artboard — defaults to `Reactions_SM`. */
  reactionsStateMachine?: string;
  /** `screen` value set on that artboard's data for this question. */
  reactionsScreen?: number;
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
 * question has him look back up at the user.
 */
export function QuestionScreen(props: QuestionScreenProps) {
  const {
    questionId,
    heading,
    selectedId,
    onSelect,
    voiceover,
    onVoiceoverDone,
    skipCount = 0,
    muted = false,
    hexMode,
    reactionsArtboard,
    reactionsStateMachine,
    reactionsScreen,
    className,
  } = props;

  const voice = useVoiceover(voiceover, true, muted, selectedId !== null);
  // Keyed on status alone, so a stale "done" left over from the previous
  // question's voiceover can't re-fire it.
  const onVoiceoverDoneRef = useRef(onVoiceoverDone);
  useEffect(() => {
    onVoiceoverDoneRef.current = onVoiceoverDone;
  });
  useEffect(() => {
    if (isVoiceoverSettled(voice.status)) onVoiceoverDoneRef.current?.();
  }, [voice.status]);
  const lastSkipCount = useRef(skipCount);
  useEffect(() => {
    if (skipCount === lastSkipCount.current) return;
    lastSkipCount.current = skipCount;
    voice.stop();
    // `voice` is a fresh object each render; only a new skip should run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipCount]);
  const spokenQuestion = questionSpoken(voice, !!voiceover?.length);
  const spokenOption = spokenOptionIndex(voice, props.options.length);

  const tiles = props.kind === "question-list" && props.variant === "tiles";
  const [typing, setTyping] = useState(0);
  // 1-based, as the reactions artboard numbers its options; 0 for none.
  const selectedOption = props.options.findIndex((option) => option.id === selectedId) + 1;

  const pick = (id: string) => {
    voice.stop();
    playClickSound();
    setTyping(Date.now());
    onSelect(id);
  };

  // The day/night question is a full-width scene above the heading rather
  // than a Hex beside it.
  const scene = hexMode === "reactions" && reactionsArtboard === DAYNIGHT_ARTBOARD;

  return (
    <div className={`flex min-h-0 flex-col px-4 ${className ?? ""}`}>
      {scene && (
        // Full-width, top-aligned under the header (pt-3 clears the progress
        // bar and buttons). Height follows the artboard's 390:267 ratio so the
        // scene always fills the full screen width (Fit.FitWidth).
        <div
          aria-hidden
          className="relative -mx-4 mt-3 aspect-390/267 shrink-0 overflow-hidden"
        >
          <div className="absolute inset-0">
            <DayNightHex
              className="h-full w-full"
              typing={typing}
              selectedId={selectedId}
              speaking={voice.playing}
              questionSpoken={spokenQuestion}
              spokenOption={spokenOption}
            />
          </div>
        </div>
      )}
      {/* Under a scene, the question + options sit on a panel with curved top
        corners that overlaps the scene's bottom edge. */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          scene
            ? "relative z-10 -mx-4 -mt-6 rounded-t-[24px] bg-white px-4 pt-6 dark:bg-background"
            : ""
        }`}
      >
      {/* Same Hex-beside-heading row on every question, tiles included. */}
      <QuestionHeading
        heading={heading}
        spoken={spokenQuestion}
        talking={voice.playing}
        typing={typing}
        screenId={questionId}
        wide={scene}
        spokenOption={spokenOption}
        layout={props.zoxLayout === "row" ? "row" : "stacked"}
        showFox={hexMode !== "reactions"}
        foxMode={tiles || hexMode === "onboarding" ? "onboarding" : "tablet"}
        hex={
          hexMode === "reactions" && !scene ? (
            <ReactionsHex
              key={reactionsArtboard}
              artboard={reactionsArtboard}
              stateMachine={reactionsStateMachine}
              screen={reactionsScreen}
              className="h-full w-full"
              typing={typing}
              selectedOption={selectedOption}
              questionId={questionId}
              speaking={voice.playing}
              questionSpoken={spokenQuestion}
              spokenOption={spokenOption}
            />
          ) : undefined
        }
      />

      {/* Keyed so each new question's options mount afresh and replay their
        own staggered drop-in (see the option components). */}
      <div key={questionId} className="flex min-h-0 flex-1 flex-col">
        {props.kind === "question-list" ? (
          <QuestionListOptions
            options={props.options}
            variant={props.variant}
            selectedId={selectedId}
            spokenOption={spokenOption}
            onPick={pick}
            compact={scene}
          />
        ) : (
          <QuestionGridOptions
            options={props.options}
            selectedId={selectedId}
            spokenOption={spokenOption}
            onPick={pick}
            compact={scene}
          />
        )}
      </div>
      </div>

    </div>
  );
}
