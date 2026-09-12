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
    <div className="flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-x-12 md:items-center md:min-h-full">
      <div className="flex flex-col items-center gap-3 text-center md:col-span-2 md:items-start md:text-left md:gap-8">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <RobuSays
            text={`${slide.eyebrow} ${slide.title}`}
            highlight={slide.eyebrow}
            instant={instantSpeech}
            side="left"
            registerAnchor={registerAnchor}
          />
        </div>

        <div className="relative hidden md:block max-w-60 rounded-[10px] bg-white px-6 py-5 text-[#2C2C2C] shadow-lg">
          <span aria-hidden className="absolute top-3 left-4 font-serif text-4xl leading-none text-primary">
            &ldquo;
          </span>
          <span className="text-lg font-semibold leading-snug">Open Your Notebook</span>
          <span aria-hidden className="absolute -bottom-3 right-4 font-serif text-4xl leading-none text-primary">
            &rdquo;
          </span>
        </div>
      </div>

      {/* Mobile keeps this screen's own teacher artwork; laptop reuses the wider
          "answer" illustration from screen 03 so it fills the 3-col space cleanly. */}
      <TeacherIllustration
        className="h-68.75 md:hidden"
        fit="contain"
        variant="bleed"
        imageLight="/images/teacherWhite.png"
        imageDark="/images/teacherBlack.png"
      />
      <TeacherIllustration
        className="hidden md:block md:h-105 md:col-span-3"
        fit="contain"
        variant="bleed"
        showNote={false}
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
      />
    </div>
  );
}
