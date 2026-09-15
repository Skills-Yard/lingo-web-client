"use client";

import { useState } from "react";
import type { TeacherIntroSlide } from "@/lib/constants/instructionsIntro";
import { TeacherIllustration } from "./TeacherIllustration";
import { RobuSays } from "./RobuSays";
import { SpeechBubble } from "./SpeechBubble";

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
  // Sequences the "Open Your Notebook" note after Robu's own line: it holds
  // its text back until Robu finishes talking, types it out the same way his
  // line does, then glows once that's done — instead of every text on this
  // screen typing at once.
  const [robuDone, setRobuDone] = useState(false);
  const [noteDone, setNoteDone] = useState(false);

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-x-12 md:items-center md:min-h-full">
      <div className="flex w-full flex-col items-center gap-3 text-center md:col-span-2 md:items-start md:text-left md:gap-8">
        {/* `w-full` on both this row and the one below (not just `items-center`
            on the mobile-centered ones): without it, a flex column's
            `items-center` cross-axis alignment leaves each child at its own
            shrink-to-fit width instead of stretching it — so RobuSays' own
            `w-full` row inside had nothing to actually span, and the whole
            chain shrink-wrapped to the growing heading text, recentering
            (and visibly sliding sideways) on every keystroke of the
            typewriter, same as the bug fixed elsewhere in RobuSays/CoverScreen. */}
        <div className="flex w-full flex-col items-center gap-3 md:items-start">
          <RobuSays
            text={`${slide.eyebrow} ${slide.title}`}
            highlight={slide.eyebrow}
            instant={instantSpeech}
            side="left"
            registerAnchor={registerAnchor}
            audioSrc="/audios/screen_3_audio.mpeg"
            onTextTyped={() => setRobuDone(true)}
          />
        </div>

        <div
          className={`relative hidden md:block max-w-60 rounded-[10px] bg-white px-6 py-5 text-[#2C2C2C] shadow-lg transition-shadow ${
            noteDone ? "animate-note-highlight" : ""
          }`}
        >
          <span
            aria-hidden
            className="absolute top-3 left-4 font-serif text-4xl leading-none text-primary"
          >
            &ldquo;
          </span>
          <span className="inline-block min-h-[1.5em] text-lg font-semibold leading-snug">
            {robuDone && (
              <SpeechBubble
                text="Open Your Notebook"
                size="plain"
                instant={instantSpeech}
                onTypingComplete={() => setNoteDone(true)}
              />
            )}
          </span>
          <span
            aria-hidden
            className="absolute -bottom-3 right-4 font-serif text-4xl leading-none text-primary"
          >
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
        noteStartTyping={robuDone}
        noteInstant={instantSpeech}
        onNoteTypingComplete={() => setNoteDone(true)}
        noteHighlighted={noteDone}
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
