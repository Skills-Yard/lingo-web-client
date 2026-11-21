"use client";

import { useRouter } from "next/navigation";
import { HEX_SLOT } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import type { TitleLines } from "@/components/level-two/levelTwo";
import { CharacterAvatar } from "./CharacterAvatar";
import { SceneBackdrop } from "./SceneBackdrop";
import type { RoomDress } from "./SequenceRoom";
import { SEQUENCE_3D_STEPS, sequence3dNext, sequence3dPrevious } from "./sequence3d";

/** Where the character's row starts (Figma `top`), as on the question screens. */
const BUBBLE_TOP = 150;
const BUBBLE_WIDTH = 230;

type Story3DScreenProps = {
  /** Its place in the 3D flow (`sequence3d.ts`). */
  position: number;
  title: TitleLines;
  /** The title's size (px), where the default would reach the screen's edges. */
  titleSize?: number;
  /** What the boy has on in the room behind. */
  dress: RoomDress;
  /** Clips read when the screen opens, where it has them. */
  voiceover?: readonly string[];
};

/**
 * A frame with nothing to answer: the title, the boy in his room, and the character
 * (its face, where Hex stands on the original screens). There is no speech bubble on
 * the 3D route: the face stands alone, at the left of where a bubble would be. Continue moves on.
 */
export function Story3DScreen({ position, title, titleSize, dress, voiceover }: Story3DScreenProps) {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={position}
      total={SEQUENCE_3D_STEPS}
      voiceover={voiceover}
      onBack={() => router.push(sequence3dPrevious(position))}
      scene={<SceneBackdrop dress={dress} />}
      ctaLabel="Continue"
      onContinue={() => router.push(sequence3dNext(position))}
    >
      <ScreenTitle>
        <span style={titleSize ? { fontSize: titleSize } : undefined}>
          <TitleText lines={title} />
        </span>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        {/* The row's width is the face and the bubble it would have: the face stays at its left. */}
        <div aria-hidden style={{ width: HEX_SLOT + BUBBLE_WIDTH }}>
          <div style={{ width: HEX_SLOT, height: HEX_SLOT }}>
            <CharacterAvatar />
          </div>
        </div>
      </CentredRow>
    </LevelTwoShell>
  );
}
