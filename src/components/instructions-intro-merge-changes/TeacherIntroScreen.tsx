import type { TeacherIntroSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";
import { RobuSays } from "./RobuSays";

export function TeacherIntroScreen({
  slide,
  instantSpeech,
  registerAnchor,
}: {
  slide: TeacherIntroSlide;
  /** Skip Robu's typewriter — set once this screen has already been seen. */
  instantSpeech?: boolean;
  registerAnchor: (el: HTMLDivElement | null) => void;
}) {
  return (
    // Grid split gated on `lg:` (1024), not `md:` (768): between those two
    // widths Robu's own box (up to 336px at `md:`, via RobuSays' shared
    // default) is wider than a `md:col-span-2` column leaves room for —
    // staying single-column a breakpoint longer (matching the note-card's
    // own `md:` switch, kept as-is) avoids that overlap. Robu's own size,
    // the quote's position/sizing, and the illustration all match View 2's
    // (bubble) layout exactly — only the greeting above stays bubble-free
    // (a plain heading, via RobuSays' own default) instead of View 2's chat
    // bubble.
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-5 lg:gap-x-8 lg:items-center-safe lg:min-h-full lg:content-center-safe">
      <div className="relative z-10 flex flex-col items-center gap-3 text-center lg:col-span-2 md:items-start md:text-left md:gap-6">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <RobuSays
            text={`${slide.eyebrow} ${slide.title}`}
            highlight={slide.eyebrow}
            instant={instantSpeech}
            side="left"
            // Shrunk below `lg:` (not the shared default, which reaches
            // 336px by `md:`) — see the grid comment above.
            robuClassName="h-32 w-32 sm:h-60 sm:w-60 md:h-36 md:w-36 lg:h-48 lg:w-48"
            // `md:`/`lg:` re-tuned for this screen's own (smaller than
            // default from `md:` up) box — the shared `ROBU_TRAILING_GAP_PULL`
            // is sized for `ROBU_DEFAULT_SIZE`'s much wider `md:` box and
            // was dragging the heading in far enough to overlap Robu here.
            robuGapPull="-ml-7 sm:-ml-15 md:-ml-6 lg:-ml-8"
            registerAnchor={registerAnchor}
          />
        </div>

        {/* Laptop/desktop only — the same big blockquote heading View 2
            uses in place of a small note-card: plain text on the screen's
            own background (no card), with the same corner-quote language
            every other note in this flow uses, just scaled up since it's
            the headline here, not a caption. */}
        <div className="relative hidden md:block max-w-2xs lg:max-w-xs">
          <span
            aria-hidden
            className="absolute -top-3 -left-1 font-serif text-4xl leading-none text-primary/70 lg:text-5xl"
          >
            &ldquo;
          </span>
          <h2 className="px-5 text-2xl font-bold leading-tight text-foreground lg:text-3xl">
            Open Your <span className="text-primary">Notebook</span>
          </h2>
          <span
            aria-hidden
            className="absolute -bottom-4 right-0 font-serif text-4xl leading-none text-primary/70 lg:text-5xl"
          >
            &rdquo;
          </span>
          <p className="mt-3 px-5 text-sm font-medium leading-relaxed text-muted-foreground lg:text-base">
            Keep your notebook ready. We&apos;ll solve some problems step by
            step.
          </p>
        </div>
      </div>

      {/* Mobile keeps this screen's own teacher artwork; laptop reuses the wider
          "answer" illustration from screen 03 so it fills the 3-col space cleanly.
          Both sizes show the "Open Your Notebook" note overlay — on laptop it now
          echoes the same line the big heading opposite it just made. */}
      <TeacherIllustration
        className="h-68.75 md:hidden"
        fit="contain"
        variant="bleed"
        imageLight="/images/teacherWhite.png"
        imageDark="/images/teacherBlack.png"
      />
      <TeacherIllustration
        className="relative z-0 hidden md:block md:h-96 lg:col-span-3"
        fit="contain"
        variant="bleed"
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
      />
    </div>
  );
}
