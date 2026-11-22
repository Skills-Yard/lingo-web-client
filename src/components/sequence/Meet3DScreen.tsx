"use client";

import { useRouter } from "next/navigation";
import { LevelTwoShell, ScreenTitle, SoftBackdrop, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { SEQUENCE_AUDIO } from "@/lib/moduleAudio";
import { CharacterOnStage, Column } from "./CharacterStage";
import { FLAT_CARDS, PictureCards } from "./PictureCards";
import { PICK_UP_ICON, PLACE_IN_TARGET_ICON, type PictureCard } from "./sequence";
import { SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";

/*
 * "Meet the Sequence" (place 13 of the 3D flow, from a Figma crop): the title, the two commands as
 * cards, and the character big underneath, close up, where the original screen has Hex's bubble row
 * (the small face) and the play button with the explanation. Neither is here: the character says
 * both lines instead (Hex's line, then the definition), so the words are heard, not read. Everything
 * is placed from the top by the design's numbers, so it scales as one piece on every device.
 */

const CARDS: readonly [PictureCard, PictureCard] = [
  { text: "Pick up", icon: PICK_UP_ICON, tint: "bg-[#F6F4FE] dark:bg-[#0F1F26]" },
  { text: "Place in target", icon: PLACE_IN_TARGET_ICON, tint: "bg-[#FFF9F0] dark:bg-[#0F1F26]" },
];
/** Where the cards start (Figma `top`). */
const CARDS_TOP = 165;
/**
 * The character: head and chest close up (`PortraitFraming`), its box 690 tall from Figma `top` 228, which puts the top of its head about
 * 138 px lower, 14 under the cards. The box runs past the bottom of the screen (a taller stage shows more of it), and it fades out low down.
 */
const CHARACTER = { top: 228, height: 690, fade: [90, 100] } as const;

/** What the character says, in order: Hex's line on the original screen, then the definition its play button used to give. */
const VOICEOVER = [...SEQUENCE_AUDIO.meetSequence, SEQUENCE_AUDIO.sequenceClip] as const;
/** The words of the definition, for the character to "say" at reading pace if its voice can't play. */
const LINE = [{ text: "A sequence is a set of instructions arranged in a particular order." }] as const;

const ignore = () => {};

export function Meet3DScreen({ position }: { position: number }) {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={position}
      total={SEQUENCE_3D_STEPS}
      voiceover={VOICEOVER}
      onBack={() => router.push(sequence3dPrevious(position))}
      scene={<SoftBackdrop />}
      onContinue={() => router.push(sequence3dNext(position))}
    >
      <Column>
        <CharacterOnStage line={LINE} silenced={false} onStage={ignore} withHint={false} centered framing="bust" top={stageTop(CHARACTER.top)} height={CHARACTER.height} fade={CHARACTER.fade} />
      </Column>
      <ScreenTitle oneLine>
        Meet the <Teal>Sequence</Teal>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(CARDS_TOP) }}>
        <PictureCards cards={CARDS} height={FLAT_CARDS.height} flat />
      </div>
    </LevelTwoShell>
  );
}
