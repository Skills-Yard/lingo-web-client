import Image from "next/image";
import { useEffect, useState } from "react";
import type { ExamplesGridSlide } from "@/lib/constants/instructionsIntro";
import { RobuSays } from "./RobuSays";
import { useRobuTalking } from "./RobuTalkingContext";

// slide.pairs[0] = Parent -> Eat the food, [1] = Coach -> Run, [2] = Traffic
// Signal -> Stop — matches the order the narration clips below were recorded
// in and named after.
const HEADING_AUDIO_SRC = "/audios/screen_5/screen5_heading_audio.m4a";
const PAIR_AUDIO_PREFIXES = ["parent", "coach", "traffic"] as const;

interface NarrationStep {
  /** Index into the flattened tile list: pair i's left tile is step 2*i,
   * right tile is step 2*i + 1 — matches ExampleTile's `highlighted` check
   * below. */
  step: number;
  src: string;
}

function buildNarrationSteps(pairCount: number): NarrationStep[] {
  return Array.from({ length: pairCount }, (_, i) => {
    const prefix = PAIR_AUDIO_PREFIXES[i];
    return [
      { step: i * 2, src: `/audios/screen_5/screen5_${prefix}_left_audio.m4a` },
      { step: i * 2 + 1, src: `/audios/screen_5/screen5_${prefix}_right_audio.m4a` },
    ];
  }).flat();
}

export function ExamplesGridScreen({
  slide,
  instantSpeech,
  registerAnchor,
}: {
  slide: ExamplesGridSlide;
  /** Skip Robu's typewriter — set once this screen has already been seen.
   * The narration audio and tile highlights below ignore this: they're the
   * point of this screen, so they always play in full, even on a revisit. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}) {
  const { startTalking, stopTalking } = useRobuTalking();
  // Which tile (see buildNarrationSteps) is currently being narrated — null
  // before the sequence starts and once it's finished.
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    // Heading clip first, then each pair's left/right clip back-to-back —
    // same "one clip, then the next, each driving its own highlight" shape
    // as TeacherQuizScreen's option narration, except this one always plays
    // (TeacherQuizScreen's skips on instantSpeech; this screen's audio is
    // the whole point, so a revisit replays it too).
    let cancelled = false;
    let headingAudio: HTMLAudioElement | null = null;
    let pairAudio: HTMLAudioElement | null = null;
    let talkingActive = false;

    const stopClipTalking = () => {
      if (!talkingActive) return;
      talkingActive = false;
      stopTalking();
    };

    const steps = buildNarrationSteps(slide.pairs.length);
    let i = 0;

    const playNextPair = () => {
      if (cancelled) return;
      if (i >= steps.length) {
        setActiveStep(null);
        return;
      }
      const { step, src } = steps[i];
      setActiveStep(step);
      pairAudio = new Audio(src);
      const advance = () => {
        if (cancelled) return;
        stopClipTalking();
        i += 1;
        playNextPair();
      };
      pairAudio.addEventListener("ended", advance);
      // A missing/unsupported clip skips ahead rather than stalling the
      // whole sequence on one bad file.
      pairAudio.addEventListener("error", advance);
      talkingActive = true;
      startTalking();
      pairAudio.play().catch(advance);
    };

    const beginPairs = () => {
      if (cancelled) return;
      stopClipTalking();
      playNextPair();
    };

    headingAudio = new Audio(HEADING_AUDIO_SRC);
    headingAudio.addEventListener("ended", beginPairs);
    headingAudio.addEventListener("error", beginPairs);
    talkingActive = true;
    startTalking();
    headingAudio.play().catch(beginPairs);

    return () => {
      cancelled = true;
      stopClipTalking();
      headingAudio?.pause();
      pairAudio?.pause();
      setActiveStep(null);
    };
  }, [slide.pairs.length, startTalking, stopTalking]);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10 md:min-h-full">
      <RobuSays
        text={slide.title}
        instant={instantSpeech}
        side="right"
        className="md:w-56 md:shrink-0"
        registerAnchor={registerAnchor}
      />

      <div className="flex flex-col gap-5 justify-center grow md:flex-row md:flex-wrap md:justify-center md:gap-x-4">
        {slide.pairs.map((pair, index) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-4 md:gap-3"
          >
            <ExampleTile
              image={pair.leftImage}
              label={pair.leftLabel}
              highlighted={activeStep === index * 2}
            />

            <Image
              src="/images/arrowLines.png"
              alt=""
              width={24}
              height={16}
              className="object-contain shrink-0"
            />

            <ExampleTile
              image={pair.rightImage}
              label={pair.rightLabel}
              highlighted={activeStep === index * 2 + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleTile({
  image,
  label,
  highlighted,
}: {
  image: string;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 w-[30vw] max-w-30 min-w-20 md:w-28 md:max-w-none transition-transform duration-300 ${
        highlighted ? "scale-110" : "scale-100"
      }`}
    >
      <div
        className={`relative w-full aspect-5/6 md:w-28 md:h-28 md:aspect-auto rounded-[18px] bg-[#EFF4F1] dark:bg-[#15181E] overflow-hidden flex items-center justify-center p-2 ring-2 transition-all duration-300 ${
          highlighted ? "ring-primary shadow-lg shadow-primary/30" : "ring-transparent"
        }`}
      >
        <Image src={image} alt={label} fill sizes="132px" className="object-contain" />
      </div>
      <span
        className={`text-xs text-center leading-tight transition-colors duration-300 ${
          highlighted ? "text-primary font-semibold" : "text-foreground font-medium"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
