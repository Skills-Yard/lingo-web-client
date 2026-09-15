import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { TeacherQuizSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";
import { RobuSays } from "./RobuSays";
import { RobuReaction } from "./RobuReaction";
import { useRobuTalking } from "./RobuTalkingContext";

interface TeacherQuizScreenProps {
  slide: TeacherQuizSlide;
  selected: number | null;
  checked: boolean;
  onSelect: (idx: number) => void;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}

// Screen 4's heading line and its two-option quiz were recorded as four
// separate clips (heading, option 1, "OR", option 2) rather than one long
// line — so, unlike every other screen's single `audioSrc`, this one plays
// as a short sequence: the heading first (via RobuSays as usual), then once
// that finishes, option 1 → "OR" → option 2 read back-to-back, with
// `optionIndex` driving which card gets a "Robu's talking about this one"
// highlight (see `narratingIdx` below). `optionIndex: null` (the "OR" clip)
// highlights nothing.
const HEADING_AUDIO_SRC = "/audios/screen_4/screen_4_audio_trim.m4a";
const OPTION_NARRATION: { src: string; optionIndex: number | null }[] = [
  { src: "/audios/screen_4/screen_4_audio_opt1.m4a", optionIndex: 0 },
  { src: "/audios/screen_4/screen_4_audio_OR.m4a", optionIndex: null },
  { src: "/audios/screen_4/screen_4_audio_opt2.m4a", optionIndex: 1 },
];

export function TeacherQuizScreen({
  slide,
  selected,
  checked,
  onSelect,
  instantSpeech,
  registerAnchor,
}: TeacherQuizScreenProps) {
  const { startTalking, stopTalking } = useRobuTalking();
  const selectedOption = selected !== null ? slide.options[selected] : null;
  const isCorrect = !!selectedOption?.isCorrect;
  const showFeedback = checked && selectedOption;
  const feedbackTitle = isCorrect ? slide.correctTitle : slide.incorrectTitle;
  const feedbackBody = isCorrect ? slide.correctText : slide.incorrectText;

  // Flips once the heading's own voice line finishes (its "ended" event, via
  // RobuSays -> SpeechBubble's onTypingComplete) — that's what kicks off the
  // option narration below, so the two clips never overlap.
  const [headingVoiced, setHeadingVoiced] = useState(false);
  // Which option (if any) Robu is currently reading aloud — null while the
  // "OR" clip plays, or once the whole sequence has finished.
  const [narratingIdx, setNarratingIdx] = useState<number | null>(null);

  useEffect(() => {
    // A revisit (`instantSpeech`) never replays any of this screen's audio —
    // matches every other voiced screen's behavior.
    if (!headingVoiced || instantSpeech) return;

    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let talkingActive = false;
    let i = 0;

    // Each clip's own start/stop pair, mirroring SpeechBubble's audio-driven
    // talking so Robu's mouth animation only runs while a clip is actually
    // playing and always hands back to idle the moment it ends/errors/the
    // screen is left mid-sequence — see RobuTalkingContext.
    const stopClipTalking = () => {
      if (!talkingActive) return;
      talkingActive = false;
      stopTalking();
    };

    const playNext = () => {
      if (cancelled) return;
      if (i >= OPTION_NARRATION.length) {
        setNarratingIdx(null);
        return;
      }
      const step = OPTION_NARRATION[i];
      setNarratingIdx(step.optionIndex);
      audio = new Audio(step.src);
      const advance = () => {
        if (cancelled) return;
        stopClipTalking();
        i += 1;
        playNext();
      };
      audio.addEventListener("ended", advance);
      // A missing/unsupported clip skips ahead rather than stalling the
      // whole sequence on one bad file.
      audio.addEventListener("error", advance);
      talkingActive = true;
      startTalking();
      audio.play().catch(advance);
    };

    playNext();

    return () => {
      cancelled = true;
      stopClipTalking();
      audio?.pause();
      setNarratingIdx(null);
    };
  }, [headingVoiced, instantSpeech, startTalking, stopTalking]);

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-x-10 md:items-center md:min-h-full md:content-center">
      <RobuSays
        text={`${slide.highlightWord} ${slide.title}`}
        highlight={slide.highlightWord}
        instant={instantSpeech}
        side="right"
        className="md:col-start-1 md:row-start-1"
        registerAnchor={registerAnchor}
        audioSrc={HEADING_AUDIO_SRC}
        onTypingComplete={() => setHeadingVoiced(true)}
      />

      {/* Same "Open Your Notebook" note as screen 03, but shown fully formed
          right away — this screen's own heading is already voiced narration,
          so a second thing typing at the same time would be one animation
          too many. */}
      <TeacherIllustration
        className="h-64 md:h-80 md:col-start-1 md:row-start-2"
        fit="cover"
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
        noteInstant
      />

      <div className="flex flex-col gap-2 md:col-start-2 md:row-start-1 md:row-span-2 md:self-center">
        {slide.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const Icon = opt.icon;

          let cardBorder = "border-border bg-card hover:border-muted-foreground/50";
          let radioStyle = "border-muted-foreground/60";
          let iconWrap =
            idx === 0
              ? "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300"
              : "bg-secondary text-primary";

          // Robu is currently reading this option aloud — a soft pulse, not
          // the "picked" ring below, so it never reads as an actual
          // selection. Only while nothing's been picked yet: a real
          // selection always wins over this passive narration highlight.
          if (narratingIdx === idx && selected === null) {
            cardBorder = "border-primary/50 bg-secondary/40 ring-1 ring-primary/20 animate-pulse";
          }

          if (isSelected && !checked) {
            cardBorder = "border-primary bg-secondary ring-1 ring-primary/30";
            radioStyle = "border-primary";
            iconWrap = "bg-primary/15 text-primary";
          } else if (isSelected && checked) {
            if (opt.isCorrect) {
              cardBorder = "border-primary bg-secondary ring-1 ring-primary/40";
              radioStyle = "border-primary";
              iconWrap = "bg-primary/15 text-primary";
            } else {
              cardBorder = "border-rose-500 bg-rose-50/80 dark:bg-[#260c11] ring-1 ring-rose-500/40";
              radioStyle = "border-rose-500";
              iconWrap = "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400";
            }
          }

          return (
            <button
              key={opt.text}
              type="button"
              disabled={checked}
              onClick={() => onSelect(idx)}
              className={`w-full flex items-center justify-between p-3 rounded-[12px] border transition-all duration-200 text-left shadow-xs cursor-pointer active:scale-99 ${cardBorder}`}
            >
              <div className="flex items-center gap-3 min-w-0 grow">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconWrap}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-medium text-sm leading-tight text-foreground">
                    {opt.text}
                  </span>
                  {!(checked && isSelected) && (
                    <span className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">
                      {opt.subtitle}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${radioStyle}`}
                >
                  {isSelected && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        checked && !opt.isCorrect ? "bg-rose-500" : "bg-primary"
                      }`}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Desktop shows the result inline with the options; mobile keeps it in the footer. */}
        {showFeedback && (
          <div
            className={`hidden md:flex items-center justify-between gap-3 rounded-[12px] p-4 overflow-hidden animate-pop-in ${
              isCorrect ? "bg-primary/10" : "bg-rose-500/10"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isCorrect ? "bg-primary" : "bg-rose-600 dark:bg-rose-500"
                  }`}
                >
                  {isCorrect ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <h3
                  className={`text-sm font-semibold ${
                    isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {feedbackTitle}
                </h3>
              </div>
              <p
                className={`text-xs font-medium leading-snug ${
                  isCorrect ? "text-primary" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {feedbackBody}
              </p>
            </div>
            <RobuReaction
              mood={isCorrect ? "happy" : "sad"}
              className="w-16 h-16 shrink-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
