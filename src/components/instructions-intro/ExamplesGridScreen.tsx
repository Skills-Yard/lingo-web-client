import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ExamplesGridSlide } from "@/lib/constants/instructionsIntro";
import { RobuSays } from "./RobuSays";
import { useRobuTalking } from "./RobuTalkingContext";

// slide.pairs[0] = Parent -> Eat the food, [1] = Coach -> Run, [2] = Traffic
// Signal -> Stop — matches the order the narration clips below were recorded
// in and named after.
const HEADING_AUDIO_SRC = "/audios/screen_5/screen5_heading_audio.m4a";
const PAIR_AUDIO_PREFIXES = ["parent", "coach", "traffic"] as const;

// Robu's own size while he's standing beside whichever tile is currently
// narrated — smaller than ROBU_DEFAULT_SIZE (his heading-side resting size)
// so he reads as popping in next to a ~112px tile to point at it, instead of
// swallowing it. RobuStage sizes him to whatever anchor box is currently
// registered (see its own doc comment), so this is just this anchor's own
// className, same technique CoverScreen's reveal state already uses for its
// own smaller, crouched Robu.
const ROBU_TILE_SIZE = "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20";

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
  // Robu's own resting spot beside the heading — captured separately from
  // the flow's shared `registerAnchor` so the effect below can send him back
  // here once the narration sequence ends (see that effect).
  const [headingAnchorEl, setHeadingAnchorEl] = useState<HTMLDivElement | null>(null);
  // One invisible marker per flattened tile step (see buildNarrationSteps),
  // positioned over each tile itself — measured the same way RobuAnchor
  // measures its own anchor, just swapped in only while that tile is active.
  const tileAnchorRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Moves the single shared Robu (see RobuStage) to whichever tile is
  // currently narrating, and back to his usual spot beside the heading once
  // the sequence finishes — so he reads as walking over to point at each
  // example as he explains it, not just talking from beside the heading the
  // whole time.
  useEffect(() => {
    if (activeStep !== null) {
      const el = tileAnchorRefs.current[activeStep];
      if (el) registerAnchor(el);
      return;
    }
    if (headingAnchorEl) registerAnchor(headingAnchorEl);
  }, [activeStep, headingAnchorEl, registerAnchor]);

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
        // No fixed `md:w-56` here any more: Robu's own anchor is already
        // ROBU_DEFAULT_SIZE's fixed 336px at `md`, wider than that column
        // ever was, so the column never actually constrained him — it only
        // clipped how much room his heading had, shoving it under the tile
        // grid (or, once the heading was pulled closer to Robu for the gap
        // fix, under Robu himself). `md:w-auto` overrides RobuSays' own
        // base `w-full` so this row sizes to its content (Robu + heading)
        // instead of claiming the whole flex row and squeezing the grid
        // sibling down to nothing. Still needed at `lg:` too — nothing
        // overrides it there.
        //
        // Robu stays smaller and to the heading's *left* (RobuSays' own
        // default row for `size="heading"`, already un-wrapped/left-justified)
        // through `sm`/`md` — only `lg:` keeps the original stacked-above,
        // full-size-Robu look untouched.
        robuClassName="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-126 lg:w-126"
        // Below `lg:`: `max-lg:[&>div:nth-child(2)]:ml-0` drops
        // `ROBU_TRAILING_GAP_PULL` — sized for `ROBU_DEFAULT_SIZE`'s much
        // bigger icon, it would otherwise pull the heading in far enough to
        // overlap this row's small Robu (same bug fixed on screen 3's small
        // Robu, see TeacherIntroScreen).
        //
        // At `lg:` and up: the original stacked layout (heading above Robu,
        // centered), just re-scoped to `lg:` (where it now actually starts)
        // instead of applying everywhere. `lg:justify-center!` needs the `!`
        // to beat this row's own base `justify-start` (same specificity, no
        // variant).
        className="md:w-auto md:max-w-105 md:shrink-0 max-lg:[&>div:nth-child(2)]:ml-0 lg:flex-col-reverse lg:justify-center! lg:text-center lg:[&>div:nth-child(2)]:ml-0"
        registerAnchor={setHeadingAnchorEl}
      />

      <div className="flex grow flex-col justify-center gap-5">
        {slide.pairs.map((pair, index) => (
          <div
            key={pair.leftLabel}
            className="flex items-center justify-center gap-4 md:gap-3"
          >
            <ExampleTile
              image={pair.leftImage}
              label={pair.leftLabel}
              highlighted={activeStep === index * 2}
              anchorRef={(el) => {
                tileAnchorRefs.current[index * 2] = el;
              }}
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
              anchorRef={(el) => {
                tileAnchorRefs.current[index * 2 + 1] = el;
              }}
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
  anchorRef,
}: {
  image: string;
  label: string;
  highlighted?: boolean;
  anchorRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 w-[30vw] max-w-30 min-w-20 md:w-28 md:max-w-none transition-transform duration-300 ${
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

      {/* Marks where Robu should stand while this tile is the one being
          narrated (see the anchor-swap effect above) — never rendered, just
          measured, same as every other screen's own RobuAnchor. */}
      <div
        ref={anchorRef}
        aria-hidden
        className={`invisible pointer-events-none absolute -bottom-2 -right-2 ${ROBU_TILE_SIZE}`}
      />
    </div>
  );
}
