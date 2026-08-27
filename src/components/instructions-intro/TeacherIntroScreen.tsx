import type { TeacherIntroSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";

/** "Let Suppose / Teacher Says" — eyebrow, title and the full teacher illustration, no quiz yet. */
export function TeacherIntroScreen({ slide }: { slide: TeacherIntroSlide }) {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-x-12 md:items-center md:min-h-full">
      <div className="flex flex-col items-center gap-3 text-center md:col-span-2 md:items-start md:text-left md:gap-8">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <p className="text-2xl md:text-3xl font-semibold text-primary">{slide.eyebrow}</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight -mt-2">
            {slide.title}
          </h1>
        </div>

        {/* Desktop-only speech card (mobile keeps the overlay badge on the image). */}
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

      <TeacherIllustration
        className="h-68.75 md:h-105 md:col-span-3"
        fit="cover"
        variant="bleed"
        noteClassName="md:hidden"
        imageLight="/images/teacherWhite.png"
        imageDark="/images/teacherBlack.png"
      />
    </div>
  );
}
