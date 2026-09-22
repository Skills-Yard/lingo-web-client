"use client";

import { useState } from "react";
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
  // Sequences the "Open Your Notebook" note after Robu's own line: it holds
  // its text back until Robu finishes talking, types it out the same way his
  // line does, then glows once that's done — instead of every text on this
  // screen typing at once.
  const [robuDone, setRobuDone] = useState(false);
  const [noteDone, setNoteDone] = useState(false);

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-5 md:gap-x-6 lg:gap-x-8 min-[1180px]:gap-x-12 md:items-center md:min-h-full">
      <div className="flex w-full flex-col items-center gap-3 text-center md:col-span-2 md:items-start md:text-left md:gap-8">
        {/* `w-full` on both this row and the one below (not just
            `items-center` on the mobile-centered ones): without it, a flex
            column's `items-center` cross-axis alignment leaves each child at
            its own shrink-to-fit width instead of stretching it — so
            RobuSays' own `w-full` row inside had nothing to actually span,
            and the whole chain shrink-wrapped to the growing heading text,
            recentering (and visibly sliding sideways) on every keystroke of
            the typewriter. */}
        <div className="flex w-full flex-col items-center gap-3 md:items-start">
          <RobuSays
            text={`${slide.eyebrow} ${slide.title}`}
            highlight={slide.eyebrow}
            instant={instantSpeech}
            side="left"
            registerAnchor={registerAnchor}
            // Without a base size, this had *only* the `min-[1180px]:`
            // override — below that breakpoint the anchor had no
            // height/width at all, collapsing to a 0×0 box RobuStage then
            // had nothing real to glide the actual mascot to, so he could
            // end up rendered off in a corner past the visible screen
            // instead of sitting in this row. Same base scale
            // `ROBU_DEFAULT_SIZE` uses, just inlined (this screen already
            // shrinks him back down at `min-[1180px]:` to leave the bubble
            // beside him room, so it can't just reuse that constant as-is).
            // Dropped the old `sm:h-60 sm:w-60` (240px) step: below `md` the
            // flow's own container is still capped at `max-w-md` (448px), so
            // that size left barely any room beside the bubble and pushed it
            // onto its own line under him.
            robuClassName="h-32 w-32 md:h-84 md:w-84 min-[1180px]:h-52 min-[1180px]:w-52"
            audioSrc="/audios/screen_3_audio.mpeg"
            // `max-md:flex-nowrap!` (the `!` beats RobuSays' own base
            // `flex-wrap`, same specificity): keeps the bubble beside Robu
            // below `md`, where he stays on the text's left.
            // `max-md:[&>div:nth-child(2)]:ml-0!`: the bubble wrapper's own
            // side="left" margin (`-ml-12`/`sm:-ml-4`) is tuned to trim the
            // blank space around `ROBU_DEFAULT_SIZE`'s much bigger icon —
            // against this screen's small `h-32` Robu it instead pulled the
            // bubble in far enough to overlap his actual artwork onto the
            // text. Cancelling it leaves just the row's own `gap-2` between
            // them below `md`.
            // `md:flex-col-reverse`: from `md` up, the heading stacks above
            // Robu instead of sitting beside him — RobuSays' own base
            // `items-center` (unconditional) then centers that column
            // horizontally, since it's the cross-axis once the row becomes a
            // column. `[&>div:nth-child(2)]:ml-0` still needed here too,
            // cancelling the bubble's side-by-side negative left-margin that
            // would otherwise skew it off-center.
            className="max-md:flex-nowrap! max-md:[&>div:nth-child(2)]:ml-0 md:flex-col-reverse md:gap-4 md:[&>div:nth-child(2)]:ml-0"
            onTextTyped={() => setRobuDone(true)}
          />
        </div>
      </div>

      {/* Mobile keeps this screen's own teacher artwork; laptop reuses the wider
          "answer" illustration from screen 03 so it fills the 3-col space cleanly.
          Both sizes show the "Open Your Notebook" note overlay. */}
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
        imageLight="/images/answerImgWhite.png"
        imageDark="/images/answerImgBlack.png"
        noteStartTyping={robuDone}
        noteInstant={instantSpeech}
        onNoteTypingComplete={() => setNoteDone(true)}
        noteHighlighted={noteDone}
      />
    </div>
  );
}
