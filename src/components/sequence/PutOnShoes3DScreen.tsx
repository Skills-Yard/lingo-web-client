"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LevelTwoShell, ScreenTitle, TitleText } from "@/components/level-two/LevelTwoShell";
import type { Span, TitleLines } from "@/components/level-two/levelTwo";
import { SEQUENCE_3D_AUDIO } from "@/lib/moduleAudio";
import { CharacterOnStage, Column, SPEECH_STAGE, type SpeechStage } from "./CharacterStage";
import { RoomBoard } from "./RoomBoard";
import { SEQUENCE_STEPS, STEP } from "./sequence";
import { sequence3dNext, sequence3dPrevious } from "./sequence3d";

const TITLE: TitleLines = [[{ text: "Let’s Put On " }, { text: "Shoes!", teal: true }]];
const TITLE_SIZE = 26;
/** What the character says (the screen's voice, `SEQUENCE_3D_AUDIO.screen3`): if the voice can't play, it talks for as long as this takes to read. */
const LINE: readonly Span[] = [{ text: "Socks are on. Now it is time for the shoes!" }];
/** How long the shoes going on is left to play before Continue unlocks. */
const SHOES_MS = 3000;

type Phase = "wait" | "playing" | "done";

/**
 * Screen 3 ("Let's Put On Shoes!") with the 3D character in Hex's place: the boy has
 * his socks on and waits on the board, a tap of "Put On Shoes" puts the shoes on, and
 * Continue unlocks once that has played and the character has said its closing line
 * (`SEQUENCE_3D_AUDIO.screen3.done`). The character says the first line first in the
 * middle of the screen, then (a fifth in) at the far left as the board slides in;
 * there is no question.
 */
export function PutOnShoes3DScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("wait");
  // How far the character is in what it says (the line, then, once the shoes are on, the one before Continue):
  // the button stays off until it has said it all.
  const [stage, setStage] = useState<SpeechStage>(SPEECH_STAGE.opening);
  const spoken = stage === SPEECH_STAGE.done;
  // It starts in the middle of the screen; the board slides in and it goes to the left when a fifth is said,
  // and they stay (the second line starts the character's count over).
  const [reached, setReached] = useState<SpeechStage>(SPEECH_STAGE.opening);
  if (stage > reached) setReached(stage);
  const boardIn = reached >= SPEECH_STAGE.board;
  const shoesTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(shoesTimer.current), []);

  const onContinue = () => {
    if (phase !== "wait") {
      router.push(sequence3dNext(STEP.shoes));
      return;
    }
    setPhase("playing");
    shoesTimer.current = window.setTimeout(() => setPhase("done"), SHOES_MS);
  };

  return (
    <LevelTwoShell
      step={STEP.shoes}
      total={SEQUENCE_STEPS}
      voiceover={phase === "done" ? SEQUENCE_3D_AUDIO.screen3.done : SEQUENCE_3D_AUDIO.screen3.question}
      onBack={() => router.push(sequence3dPrevious(STEP.shoes))}
      scene={<RoomBoard dress={phase === "wait" ? "socks" : "dressed"} shown={boardIn} />}
      ctaLabel={phase === "wait" ? "Put On Shoes" : "Continue"}
      ctaDisabled={!spoken || phase === "playing"}
      onContinue={onContinue}
    >
      <Column>
        <CharacterOnStage line={LINE} silenced={false} onStage={setStage} centered={!boardIn} withHint={false} />
      </Column>
      <ScreenTitle oneLine>
        <span style={{ fontSize: TITLE_SIZE }}>
          <TitleText lines={TITLE} />
        </span>
      </ScreenTitle>
    </LevelTwoShell>
  );
}
