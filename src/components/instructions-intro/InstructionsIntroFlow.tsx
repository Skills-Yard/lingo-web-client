"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { Poppins } from "next/font/google";
import {
  configureRiveRuntime,
  REWARD_RIVE_SRC,
  ROBU_RIVE_SRC_LIGHT,
  ROBU_RIVE_SRC_DARK,
} from "@/lib/rive/runtime";
import { INSTRUCTIONS_INTRO_SLIDES } from "@/lib/constants/instructionsIntro";
import { useSound } from "@/hooks/useSound";
import { IntroHeader } from "./IntroHeader";
import { IntroFooter, type PrimaryState } from "./IntroFooter";
import { CoverScreen } from "./CoverScreen";
import { TeacherIntroScreen } from "./TeacherIntroScreen";
import { TeacherQuizScreen } from "./TeacherQuizScreen";
import { ExamplesGridScreen } from "./ExamplesGridScreen";
import { VideoScreen } from "./VideoScreen";
import { QuestionnaireScreen } from "./QuestionnaireScreen";
import { RewardScreen } from "./RewardScreen";
import { GameBoardScreen } from "./GameBoardScreen";
import { RobuScreen } from "./RobuScreen";
import { RobuStage } from "./RobuStage";
import { RobuTalkingContext } from "./RobuTalkingContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

interface InstructionsIntroFlowProps {
  onComplete?: () => void;
  initialIndex?: number;
  /** Mount Robu already past his one-shot entrance — for a caller that
   * remounts this whole flow (a fresh `InstructionsIntroFlow` instance) after
   * Robu's already made his entrance once elsewhere, where replaying it would
   * read as him re-entering from scratch rather than picking back up. Default
   * (false) is every normal mount of this flow, which still gets the entrance. */
  skipRobuIntro?: boolean;
}

export function InstructionsIntroFlow({
  onComplete,
  initialIndex = 0,
  skipRobuIntro = false,
}: InstructionsIntroFlowProps) {
  const [index, setIndex] = useState(initialIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<
    string | null
  >(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  // Bumped to force RewardScreen to remount (resetting its own internal
  // "claimed" + box state) when Back unwinds a claim without changing slides.
  const [rewardResetKey, setRewardResetKey] = useState(0);
  const [checked, setChecked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [gameSolved, setGameSolved] = useState(false);
  const [coverRevealed, setCoverRevealed] = useState(false);
  const [boxTapped, setBoxTapped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const triggerSound = useSound(true);

  // The single, persistent Robu mascot (see RobuStage) — every screen just
  // registers where it currently belongs; only one anchor is ever mounted at
  // a time, so this always reflects the active screen's own spot for it.
  const [robuAnchorEl, setRobuAnchorEl] = useState<HTMLDivElement | null>(null);
  const robuStageRef = useRef<HTMLDivElement>(null);

  // Whether Robu's mouth-talking overlay should be playing right now — true
  // for as long as *any* heading/bubble text anywhere in the flow is
  // actively typing (see RobuTalkingContext/SpeechBubble). Ref-counted
  // rather than a plain boolean so two overlapping typewriters (e.g. Robu's
  // own line finishing right as a note card's own line starts) can't have
  // the first one's completion turn Robu's mouth off while the second is
  // still going.
  const talkingCountRef = useRef(0);
  const [robuTalking, setRobuTalking] = useState(false);
  const startTalking = useCallback(() => {
    talkingCountRef.current += 1;
    setRobuTalking(true);
  }, []);
  const stopTalking = useCallback(() => {
    talkingCountRef.current = Math.max(0, talkingCountRef.current - 1);
    if (talkingCountRef.current === 0) setRobuTalking(false);
  }, []);

  // Whether Robu's one-shot `intro` Rive timeline has finished. Owned here
  // (not inside RobuStage) so CoverScreen can hold its heading/bubble back
  // and keep Robu at his big "entering" size until this actually flips —
  // synced to the real animation instead of a guessed timer. The 6s
  // fallback is only a safety net in case the Rive completion event never
  // fires for some reason, so the rest of screen 1 is never stuck hidden.
  const [robuIntroDone, setRobuIntroDone] = useState(skipRobuIntro);
  useEffect(() => {
    if (robuIntroDone) return;
    const t = window.setTimeout(() => setRobuIntroDone(true), 6000);
    return () => window.clearTimeout(t);
  }, [robuIntroDone]);

  const total = INSTRUCTIONS_INTRO_SLIDES.length;
  const slide = INSTRUCTIONS_INTRO_SLIDES[index];
  const stepNumber = index + 1;

  // Every slide's Robu line types out the first time it's seen; on a later
  // revisit (e.g. after pressing Back) it shows fully formed instead of
  // re-typing. `seenSlides` only ever grows, so once typed, always instant.
  // Marked during render (React's documented pattern for reacting to a state
  // change without an Effect) rather than in a useEffect: the slide being
  // *left* is what gets flagged seen, so the slide just arrived at still
  // reads as unseen for this same render and types out normally.
  const [seenSlides, setSeenSlides] = useState<Set<number>>(() => new Set());
  const [lastIndex, setLastIndex] = useState(index);
  if (index !== lastIndex) {
    setLastIndex(index);
    setSeenSlides((prev) => (prev.has(lastIndex) ? prev : new Set(prev).add(lastIndex)));
  }
  const instantSpeech = seenSlides.has(index);

  // Nudge Robu with a little shake while cover-reveal is prompting a tap and
  // hasn't gotten one yet — computed here (not inside CoverScreen) since the
  // mascot itself now lives in the single shared RobuStage, not that screen.
  const robuShake = slide.kind === "cover-reveal" && coverRevealed && !boxTapped;

  const isQuiz = slide.kind === "teacher-quiz";
  const isQuestionnaire = slide.kind === "questionnaire";

  const goNext = () => {
    setSelected(null);
    setSelectedQuestionnaireId(null);
    setRewardClaimed(false);
    setChecked(false);
    setGameSolved(false);
    setCoverRevealed(false);
    setBoxTapped(false);
    setModalOpen(false);
    if (index >= total - 1) {
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  // Mirrors goNext's own staged progression (reveal card -> tap -> modal,
  // select -> check -> retry, claim, ...) one step at a time instead of
  // resetting every sub-step and the slide index all at once — otherwise a
  // single Back press could unwind several visible steps at once and read as
  // jumping straight back past screens the learner actually walked through.
  const goBack = () => {
    if (slide.kind === "cover-reveal") {
      if (modalOpen) {
        setModalOpen(false);
        return;
      }
      if (boxTapped) {
        setBoxTapped(false);
        return;
      }
      // No separate "undo the reveal" stop any more: the reveal itself is no
      // longer a manual step (see `onIntroTypingComplete`) — it fires on its
      // own the instant Robu's line finishes typing, so there's nothing
      // stable to rewind back to between screen 1 and the box being tapped.
      // Back here falls straight through to leaving the screen entirely.
    }
    if (isQuiz) {
      if (checked) {
        setChecked(false);
        return;
      }
      if (selected !== null) {
        setSelected(null);
        return;
      }
    }
    if (isQuestionnaire) {
      if (checked) {
        setChecked(false);
        return;
      }
      if (selectedQuestionnaireId !== null) {
        setSelectedQuestionnaireId(null);
        return;
      }
    }
    if (slide.kind === "reward" && rewardClaimed) {
      setRewardClaimed(false);
      setRewardResetKey((k) => k + 1);
      return;
    }

    if (index === 0) return;
    setSelected(null);
    setSelectedQuestionnaireId(null);
    setChecked(false);
    setGameSolved(false);
    setCoverRevealed(false);
    setBoxTapped(false);
    setModalOpen(false);
    setIndex((i) => i - 1);
  };

  const selectedOption =
    isQuiz && selected !== null ? slide.options[selected] : null;
  const isCorrect = !!selectedOption?.isCorrect;

  // For questionnaire: find the selected item and check if it's correct
  let selectedQuestionnaireItem = null;
  let questionnaireIsCorrect = false;
  if (isQuestionnaire && selectedQuestionnaireId) {
    selectedQuestionnaireItem = slide.items.find(
      (item) => item.id === selectedQuestionnaireId,
    );
    questionnaireIsCorrect = !!selectedQuestionnaireItem?.isCorrect;
  }

  const handleSelect = (idx: number) => {
    triggerSound("tap");
    setSelected(idx);
  };

  const handleQuestionnaireSelect = (id: string) => {
    triggerSound("tap");
    setSelectedQuestionnaireId(id);
  };

  const handlePrimaryAction = () => {
    if (slide.kind === "cover-reveal" && !coverRevealed) {
      // First press pops the reveal card in and sends Robu over to point at
      // it. The button then goes disabled (see primaryState) until the card
      // is actually tapped, so this branch only ever fires once.
      setCoverRevealed(true);
      return;
    }
    if (isQuiz && !checked) {
      if (selected === null) return;
      setChecked(true);
      triggerSound(isCorrect ? "win" : "lose");
      return;
    }
    if (isQuiz && checked && !isCorrect) {
      // Wrong answer: let the learner try again instead of moving on.
      setSelected(null);
      setChecked(false);
      return;
    }
    if (isQuestionnaire && !checked) {
      if (selectedQuestionnaireId === null) return;
      setChecked(true);
      triggerSound(questionnaireIsCorrect ? "win" : "lose");
      return;
    }
    if (isQuestionnaire && checked && !questionnaireIsCorrect) {
      // Wrong answer: let them try again
      setSelectedQuestionnaireId(null);
      setChecked(false);
      return;
    }
    goNext();
  };

  const primaryLabel =
    (slide.kind === "teacher-quiz" || slide.kind === "questionnaire") &&
    !checked
      ? slide.kind === "teacher-quiz"
        ? slide.submitLabel
        : "Check Answer"
      : (isQuiz || isQuestionnaire) &&
          checked &&
          !(isCorrect || questionnaireIsCorrect)
        ? "Try Again"
        : slide.cta;

  const primaryState: PrimaryState =
    slide.kind === "game" && !gameSolved
      ? "disabled"
      : slide.kind === "cover-reveal" && coverRevealed && !boxTapped
        ? "disabled"
        : isQuiz && !checked && selected === null
          ? "disabled"
          : isQuestionnaire && !checked && selectedQuestionnaireId === null
            ? "disabled"
            : isQuiz && checked && !isCorrect
              ? "retry"
              : isQuestionnaire && checked && !questionnaireIsCorrect
                ? "retry"
                : "go";

  // The questionnaire's "Claim Reward" CTA gets the dark tone + gift icon (see command9).
  const isRewardCta = isQuestionnaire && checked && questionnaireIsCorrect;

  const feedback =
    slide.kind === "teacher-quiz" && checked && selectedOption
      ? {
          isCorrect,
          title: isCorrect ? slide.correctTitle : slide.incorrectTitle,
          body: isCorrect ? slide.correctText : slide.incorrectText,
        }
      : isQuestionnaire && checked && selectedQuestionnaireItem
        ? {
            isCorrect: questionnaireIsCorrect,
            title: questionnaireIsCorrect
              ? "Correct, you got it!"
              : "Oops! Not quite.",
            body: selectedQuestionnaireItem.feedback ?? "",
            image: questionnaireIsCorrect
              ? "/images/sprouty.png"
              : "/images/sprouty-worng-ans.png",
            flipImage: false,
          }
        : null;

  // Warm the Rive assets while the user is still on the earlier slides so the
  // reward screen has its WASM runtime and .riv file cached by the time it
  // mounts — this is what removes the long "blank canvas" delay.
  useEffect(() => {
    configureRiveRuntime();
    preload("/rive/rive.wasm", { as: "fetch" });
    preload(REWARD_RIVE_SRC, { as: "fetch" });
    // Preload both themes' Robu file — whichever isn't active yet is still
    // needed the moment the user toggles dark/light mode.
    preload(ROBU_RIVE_SRC_LIGHT, { as: "fetch" });
    preload(ROBU_RIVE_SRC_DARK, { as: "fetch" });
  }, []);

  return (
    <RobuTalkingContext.Provider value={{ startTalking, stopTalking }}>
    <main
      className={`${poppins.className} h-screen w-full max-w-full overflow-hidden bg-background dark:bg-[#0D1016] text-foreground flex flex-col items-center transition-colors duration-200`}
    >
      <div className="w-full max-w-md md:max-w-7xl flex flex-col h-full">
        {/* ── Header (same on every slide) — fixed height, never scrolls or gets covered ── */}
        <IntroHeader
          stepNumber={stepNumber}
          stepTotal={total}
          bookmarked={bookmarked}
          onBack={goBack}
          onToggleBookmark={() => setBookmarked((b) => !b)}
        />

        {/* ── Body — the only part that scrolls, so header/footer are always fully visible.
            Also Robu's positioning root (`relative`) — RobuStage lives here as one
            persistent, absolutely-positioned instance that glides to whichever
            screen's anchor is currently mounted below, instead of each screen
            mounting (and the last one unmounting) its own mascot. ── */}
        <div
          ref={robuStageRef}
          className="relative flex-1 min-h-0 overflow-y-auto px-4 md:px-10 scrollbar-none"
          style={{ msOverflowStyle: "none" }}
        >
          <RobuStage
            anchorEl={robuAnchorEl}
            shake={robuShake}
            containerRef={robuStageRef}
            onIntroComplete={() => setRobuIntroDone(true)}
            skipIntro={skipRobuIntro}
            talking={robuTalking}
          />
          <div className="flex flex-col gap-3 select-none min-h-full pb-3 md:pb-0 md:justify-center">
            {(slide.kind === "cover" || slide.kind === "cover-reveal") && (
              // One call site for both steps — see CoverScreen's doc comment:
              // this is what keeps its layout mounted (no remount) across them.
              <CoverScreen
                slide={slide}
                revealed={coverRevealed}
                onBoxTap={() => setBoxTapped(true)}
                boxTapped={boxTapped}
                modalOpen={modalOpen}
                onOpenModal={() => setModalOpen(true)}
                // Dismissing the reveal modal (X / backdrop / Escape) is the
                // learner finishing screen 2's interaction — advance straight
                // to the next screen instead of leaving them to press the
                // footer's "Next" a second time. goNext() already resets
                // `modalOpen` (and everything else per-slide) as part of its
                // own transition. The header's own Back button is unaffected
                // — it still just closes the modal in place (see goBack).
                onCloseModal={goNext}
                // Collapses screen 2's old two-Next-press flow into one: the
                // reveal card pops in on its own the moment Robu's intro line
                // finishes typing, instead of waiting on a manual press that
                // would only ever do the same thing.
                onIntroTypingComplete={() => setCoverRevealed(true)}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
                robuIntroDone={robuIntroDone}
              />
            )}
            {slide.kind === "teacher-intro" && (
              <TeacherIntroScreen
                slide={slide}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "teacher-quiz" && (
              <TeacherQuizScreen
                slide={slide}
                selected={selected}
                checked={checked}
                onSelect={handleSelect}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "examples-grid" && (
              <ExamplesGridScreen
                slide={slide}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "video" && (
              <VideoScreen
                slide={slide}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "questionnaire" && (
              <QuestionnaireScreen
                slide={slide}
                selectedId={selectedQuestionnaireId}
                checked={checked}
                onSelect={handleQuestionnaireSelect}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "reward" && (
              <RewardScreen
                key={rewardResetKey}
                slide={slide}
                onClaim={() => console.log("Reward claimed")}
                onClaimStateChange={setRewardClaimed}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "game" && (
              <GameBoardScreen
                slide={slide}
                onSolvedChange={setGameSolved}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
              />
            )}
            {slide.kind === "robu" && (
              <RobuScreen slide={slide} registerAnchor={setRobuAnchorEl} />
            )}
          </div>
        </div>

        {/* ── Footer — shrink-0, in normal flow, so it can never overlap scrollable content above it ── */}
        {!(slide.kind === "reward" && !rewardClaimed) && (
          <IntroFooter
            primaryLabel={primaryLabel}
            primaryState={primaryState}
            onPrimaryAction={handlePrimaryAction}
            feedback={feedback}
            ctaFullWidth={slide.kind !== "teacher-intro"}
            primaryTone={isRewardCta ? "dark" : "brand"}
            leadingIcon={
              isRewardCta ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/clam-box.png"
                  alt=""
                  className="w-6 h-6 object-contain"
                />
              ) : undefined
            }
          />
        )}
      </div>
    </main>
    </RobuTalkingContext.Provider>
  );
}
