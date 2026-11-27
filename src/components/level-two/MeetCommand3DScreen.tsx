"use client";

import { useRouter } from "next/navigation";
import { CharacterPortrait } from "@/components/character3d/CharacterPortrait";
import { Column } from "@/components/sequence/CharacterStage";
import { IntroBackdrop } from "@/components/sequence/Intro3DScreen";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import { AudioPlayer } from "./AudioPlayer";
import { CommandTag } from "./CommandTag";
import { aboveButtons, LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { levelTwoHref } from "./levelTwo";

/*
 * "Meet the Command." with the 3D character (from the design's picture, numbers in stage px): the title, the pale circle with the
 * character standing in it from the head to the belt (its lower part fades out over the voice clip), the tilted terminal tag at the
 * upper right and the voice clip's pill just over Continue. The character only stands: the clip is what is said (as on the original
 * screen, whose sentence under the clip is not in the design).
 */

/** The circle behind the character. */
const CIRCLE = { left: 29, top: 275, size: 331 };
/** The terminal tag, at the character's upper right. */
const TAG = { left: 244, top: 142, width: 112 };
/** The character: `bust` framing shows 1.44 m over `height`, the head's top 0.2 of the way down (so at 133, under the title). */
const CHARACTER = { top: 1, height: 660 };
/** The clip's pill (69 tall) stands this far over the main button; the character fades out into it. */
const PLAYER = { gap: 30, height: 69 };
const FADE = "linear-gradient(180deg, #000 0%, #000 80%, transparent 100%)";

export function MeetCommand3DScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={9} scene={<IntroBackdrop circle={CIRCLE} />} onContinue={() => router.push(levelTwoHref(10))}>
      <Column>
        <div
          aria-hidden
          className="absolute inset-x-0 overflow-hidden"
          style={{ top: 0, bottom: aboveButtons(PLAYER.gap + PLAYER.height - 6), maskImage: FADE, WebkitMaskImage: FADE }}
        >
          <div className="absolute inset-x-0" style={{ top: CHARACTER.top, height: CHARACTER.height }}>
            <CharacterPortrait animationId="idle-b" framing="bust" />
          </div>
        </div>
        <CommandTag {...TAG} />
      </Column>
      <ScreenTitle>
        Meet the <Teal>Command.</Teal>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: aboveButtons(PLAYER.gap) }}>
        <AudioPlayer src={MODULE_AUDIO.meetCommand[0]} />
      </div>
    </LevelTwoShell>
  );
}
