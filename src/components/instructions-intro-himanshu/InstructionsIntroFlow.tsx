"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { Poppins } from "next/font/google";
import {
  configureRiveRuntime,
  REWARD_RIVE_SRC,
  ROBU_RIVE_SRC,
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
import { RobuSplash } from "./RobuSplash";
import { PreLoginScreen } from "./PreLoginScreen";
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

  // Whether Robu's one-shot splash sequence (`<RobuSplash>`, rendered below
  // in place of `<PreLoginScreen>`/`<RobuStage>` while this is false — see
  // `showSplash`) has finished. The 6s fallback is only a safety net in case
  // RobuSplash's own completion timer never fires for some reason, so the
  // rest of screen 1 is never stuck hidden.
  const [splashDone, setSplashDone] = useState(skipRobuIntro);
  useEffect(() => {
    if (splashDone) return;
    const t = window.setTimeout(() => setSplashDone(true), 6000);
    return () => window.clearTimeout(t);
  }, [splashDone]);

  // Whether `<PreLoginScreen>` ("Get Started"/"Log in", shown right after
  // the splash — see `showPreLogin`) has been dismissed. CoverScreen's own
  // heading/bubble hold-back (its `robuIntroDone` prop) keys off *this*, not
  // `splashDone` — the cover screen shouldn't reveal itself while the
  // pre-login screen is still covering it.
  const [preLoginDone, setPreLoginDone] = useState(skipRobuIntro);

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

  // Robu's one-shot "hi " wave: only on screen 1 itself, and only once
  // pre-login has actually been dismissed (see `preLoginDone` above) — going
  // false->true again (e.g. Back to screen 1 from screen 2) replays it, same
  // as arriving fresh.
  const robuGreeting = slide.kind === "cover" && preLoginDone;

  // While true, screen 1 shows the full-screen `<RobuSplash>` in place of
  // `<PreLoginScreen>`/the persistent, gliding mascot — false on every other
  // screen regardless of `splashDone`, so a learner who somehow advances
  // past screen 1 before the splash's own timer fires still gets the
  // persistent mascot rather than nothing at all.
  const showSplash = slide.kind === "cover" && !splashDone;

  // Once the splash is done, screen 1 shows `<PreLoginScreen>` in its place
  // until "Get Started" is pressed — same false-everywhere-else reasoning
  // as `showSplash` above.
  const showPreLogin = slide.kind === "cover" && splashDone && !preLoginDone;

  // Robu's "speak" mouth overlay only plays from screen 2 onward — screen 1
  // (cover) is still carrying its own "hi" intro/greeting, so this keeps the
  // two from fighting each other on that first screen.
  const robuTalkingActive = robuTalking && slide.kind !== "cover";

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
          }
        : null;

  // Warm the Rive assets while the user is still on the earlier slides so the
  // reward screen has its WASM runtime and .riv file cached by the time it
  // mounts — this is what removes the long "blank canvas" delay.
  useEffect(() => {
    configureRiveRuntime();
    preload("/rive/rive.wasm", { as: "fetch" });
    preload(REWARD_RIVE_SRC, { as: "fetch" });
    preload(ROBU_RIVE_SRC, { as: "fetch" });
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
          {showSplash ? (
            <RobuSplash
              // `fixed inset-0` (not `absolute`) so this covers the actual
              // screen edge-to-edge, including over the header above —
              // regardless of the `max-w-md`/`max-w-7xl` content column
              // everything else here sits inside. z-50 to sit above that
              // header rather than under it.
              className="pointer-events-none fixed inset-0 z-50"
              onComplete={() => setSplashDone(true)}
            />
          ) : showPreLogin ? (
            <PreLoginScreen
              // Same full-screen treatment as RobuSplash above, minus
              // `pointer-events-none` — this one has real buttons on it.
              className="fixed inset-0 z-50"
              onGetStarted={() => setPreLoginDone(true)}
            />
          ) : (
            <RobuStage
              anchorEl={robuAnchorEl}
              shake={robuShake}
              containerRef={robuStageRef}
              greet={robuGreeting}
              talking={robuTalkingActive}
            />
          )}
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
                onCloseModal={() => setModalOpen(false)}
                // Collapses screen 2's old two-Next-press flow into one: the
                // reveal card pops in on its own the moment Robu's intro line
                // finishes typing, instead of waiting on a manual press that
                // would only ever do the same thing.
                onIntroTypingComplete={() => setCoverRevealed(true)}
                instantSpeech={instantSpeech}
                registerAnchor={setRobuAnchorEl}
                // Named for what CoverScreen actually needs to know ("is my
                // own hold-back over") rather than which upstream state
                // happens to drive it right now — see `preLoginDone` above.
                robuIntroDone={preLoginDone}
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
