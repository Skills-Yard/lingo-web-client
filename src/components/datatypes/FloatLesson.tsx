"use client";

import { useState } from "react";
import { AudioPlayer } from "@/components/level-two/AudioPlayer";
import { BounceIn } from "@/components/level-two/BounceIn";
import { SlotImage } from "@/components/level-two/SlotImage";
import { DATATYPES_AUDIO } from "@/lib/moduleAudio";
import { P } from "@/components/kit/content/from-datatypes/pictures";

/** The picture is drawn this big (15px in from each side of the frame); the art is 1436 x 640. */
const PICTURE = { width: 360, height: 160 } as const;
/** How far below the picture the voice clip stands, and how far below the clip the words begin. */
const PLAYER_GAP = 100;
const WORDS_GAP = 18;

/** The explanation, word by word, so each can darken as the clip reaches it. */
const WORDS: readonly { text: string; teal?: boolean }[] = [
  { text: "In" },
  { text: "Python," },
  { text: "numbers" },
  { text: "with" },
  { text: "decimal" },
  { text: "values" },
  { text: "are" },
  { text: "represented" },
  { text: "using" },
  { text: "a" },
  { text: "data" },
  { text: "type" },
  { text: "called" },
  { text: "Float.", teal: true },
];

/**
 * Screen 8: two students with their heights, a voice clip, and what it says in
 * words. The words start pale; as the clip plays they darken (as on "Meet the
 * Sequence."), and stay dark once heard. The parts bounce in, one by one, once Hex
 * has finished his line.
 */
export function FloatLesson({ shown }: { shown: boolean }) {
  // How much of the clip has played (0-1): the words up to there are dark.
  const [progress, setProgress] = useState(0);
  const heard = Math.round(progress * WORDS.length);
  return (
    <div className="flex flex-col items-center" style={{ width: PICTURE.width }}>
      <BounceIn index={0} shown={shown}>
        <div style={{ width: PICTURE.width, height: PICTURE.height }}>
          <SlotImage file={P.floatHeights} className="h-full w-full object-contain" />
        </div>
      </BounceIn>
      <BounceIn index={1} shown={shown} className="flex justify-center">
        <div style={{ marginTop: PLAYER_GAP }}>
          <AudioPlayer src={DATATYPES_AUDIO.floatClip} standInSeconds={4} onProgress={setProgress} />
        </div>
      </BounceIn>
      <BounceIn index={2} shown={shown}>
        <p className="w-[340px] text-center text-[20px] leading-[28px] font-semibold" style={{ marginTop: WORDS_GAP }}>
          {WORDS.map((word, index) => {
            const read = index < heard;
            const tone = word.teal ? `text-level-gradient ${read ? "opacity-100" : "opacity-30"}` : read ? "text-[#2B2B2B] dark:text-white" : "text-[#C3C8CF] dark:text-white/30";
            return (
              <span key={index} className={`transition-[color,opacity] duration-300 ${tone}`}>
                {word.text}{" "}
              </span>
            );
          })}
        </p>
      </BounceIn>
    </div>
  );
}
