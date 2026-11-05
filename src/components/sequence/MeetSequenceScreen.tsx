"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioPlayer } from "@/components/level-two/AudioPlayer";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { PictureCards } from "./PictureCards";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious, type PictureCard } from "./sequence";

/** The clip on the player. It isn't recorded yet: until the file is there, Play runs a silent stand-in of `STAND_IN_SECONDS`. */
const CLIP = "/audios/moduleAudios/meet_the_sequence.mp3";
const STAND_IN_SECONDS = 5;
const STEP = 6;
const CARDS: readonly [PictureCard, PictureCard] = [
  { text: "Pick Up", icon: PICK_UP_ICON, tint: "bg-[#F6F4FE] dark:bg-[#0F1F26]" },
  { text: "Place in target", icon: PLACE_IN_TARGET_ICON, tint: "bg-[#FFF9F0] dark:bg-[#0F1F26]" },
];
const CARDS_TOP = 280;
const CARDS_HEIGHT = 176;
const PLAYER_TOP = 482;

/** The explanation, word by word, so each can darken as the clip reaches it. */
const WORDS: readonly { text: string; teal?: boolean }[] = [
  { text: "A" },
  { text: "sequence" },
  { text: "is" },
  { text: "a" },
  { text: "set", teal: true },
  { text: "of", teal: true },
  { text: "instructions", teal: true },
  { text: "arranged" },
  { text: "in" },
  { text: "a" },
  { text: "particular" },
  { text: "order." },
];

/**
 * "Meet the Sequence.": what the module has been showing, given its name. The
 * explanation starts pale and grey; as the clip plays it darkens word by word
 * to matte black, and stays dark once it has been heard (Play again to replay).
 */
export function MeetSequenceScreen() {
  const router = useRouter();
  // How much of the clip has played (0-1): the words up to there are dark.
  const [progress, setProgress] = useState(0);
  const heard = Math.round(progress * WORDS.length);
  return (
    <LevelTwoShell
      step={STEP.meet}
      total={SEQUENCE_STEPS}
      voiceover={SEQUENCE_AUDIO.meetSequence}
      onBack={() => router.push(sequencePrevious(STEP))}
      scene={<SoftBackdrop />}
      onContinue={() => router.push(sequenceNext(STEP.meet))}
    >
      <ScreenTitle oneLine>
        Meet the <Teal>Sequence.</Teal>
      </ScreenTitle>
      <CentredRow top={stageTop(160)}>
        <HexBubble entryKey="meet-sequence" hex="left" line={[{ text: "Order matters as some instructions come first then another." }]} size={{ width: 230 }} />
      </CentredRow>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(CARDS_TOP) }}>
        <PictureCards cards={CARDS} height={CARDS_HEIGHT} />
      </div>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(PLAYER_TOP) }}>
        <AudioPlayer src={SEQUENCE_AUDIO.sequenceClip} />
      </div>
      <p
        className="absolute text-center text-[20px] leading-[28px] font-semibold"
        style={{ bottom: aboveButtons(32), width: 340, left: "calc(50% - 170px)" }}
      >
        {WORDS.map((word, index) => {
          const read = index < heard;
          const tone = word.teal
            ? `text-level-gradient ${read ? "opacity-100" : "opacity-30"}`
            : read
              ? "text-[#2B2B2B] dark:text-white"
              : "text-[#C3C8CF] dark:text-white/30";
          return (
            <span key={index} className={`transition-[color,opacity] duration-300 ${tone}`}>
              {word.text}{" "}
            </span>
          );
        })}
      </p>
    </LevelTwoShell>
  );
}
