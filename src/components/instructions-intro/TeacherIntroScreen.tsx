import type { TeacherIntroSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";
import { RobuSays } from "./RobuSays";
import { ROBU_DEFAULT_SIZE } from "./RobuAnchor";

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
    <div className="flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-x-8 md:items-center md:min-h-full md:content-center">
      <div className="relative z-10 flex flex-col items-center gap-3 text-center md:col-span-2 md:items-start md:text-left md:gap-6">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <RobuSays
            text={`${slide.eyebrow} ${slide.title}`}
            highlight={slide.eyebrow}
            instant={instantSpeech}
            side="left"
            sideLg="left"
            robuClassName={`${ROBU_DEFAULT_SIZE} md:h-36 md:w-36 lg:h-48 lg:w-48`}
            registerAnchor={registerAnchor}
          />
        </div>

        {/* Laptop/desktop only — mirrors the reference design's big blockquote
            heading in place of the old small white note-card. Left as plain
            text on the screen's own background (no card) with the same
            corner-quote language every other note in this flow uses, just
            scaled up since it's the headline here, not a caption. */}
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
        className="relative z-0 hidden md:block md:h-96 md:col-span-3"
        fit="contain"
        variant="bleed"
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
      />
    </div>
  );
}
