"use client";

import { useRouter } from "next/navigation";
import { AudioPlayer } from "@/components/level-two/AudioPlayer";
import { HexBubble } from "@/components/level-two/HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { PictureCards } from "./PictureCards";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, SEQUENCE_STEPS, sequenceNext, sequencePrevious, type PictureCard } from "./sequence";

const STEP = 6;
const CARDS: readonly [PictureCard, PictureCard] = [
  { text: "Pick Up", icon: PICK_UP_ICON, tint: "bg-[#F6F4FE] dark:bg-[#0F1F26]" },
  { text: "Place in target", icon: PLACE_IN_TARGET_ICON, tint: "bg-[#FFF9F0] dark:bg-[#0F1F26]" },
];
const CARDS_TOP = 280;
const CARDS_HEIGHT = 176;
const PLAYER_TOP = 482;

/** "Meet the Sequence.": what the module has been showing, given its name. */
export function MeetSequenceScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={STEP}
      total={SEQUENCE_STEPS}
      voiceover={SEQUENCE_AUDIO.meetSequence}
      onBack={() => router.push(sequencePrevious(STEP))}
      scene={<SoftBackdrop />}
      onContinue={() => router.push(sequenceNext(STEP))}
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
        className="absolute text-center text-[20px] leading-[28px] font-semibold text-[#444444] dark:text-white"
        style={{ bottom: aboveButtons(32), width: 340, left: "calc(50% - 170px)" }}
      >
        A sequence is a <Teal>set of instructions</Teal> arranged in a particular order.
      </p>
    </LevelTwoShell>
  );
}
