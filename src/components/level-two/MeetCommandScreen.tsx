"use client";

import { useRouter } from "next/navigation";
import { AudioPlayer, COMMAND_AUDIO } from "./AudioPlayer";
import { aboveButtons, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotBackdrop, robotAboveTop } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/** Figma: the voice clip's top edge is 514px down the frame. */
const PLAYER_TOP = 514;

/**
 * `/module?step=9` — "Meet the Command.": the robot, a voice clip to play
 * under it, and what instructions are known as.
 */
export function MeetCommandScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={9} scene={<RobotBackdrop bottom={robotAboveTop(stageTop(PLAYER_TOP))} pose="idle" />} ctaLabel="Next" onContinue={() => router.push(levelTwoHref(10))}>
      <ScreenTitle>
        Meet the <Teal>Command.</Teal>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(PLAYER_TOP) }}>
        <AudioPlayer src={COMMAND_AUDIO} />
      </div>
      <p
        className="absolute text-center text-[20px] leading-[28px] font-semibold text-[#444444]"
        style={{ bottom: aboveButtons(32), width: 340, left: "calc(50% - 170px)" }}
      >
        In Programming Languages, instructions are known as <Teal>command.</Teal>
      </p>
    </LevelTwoShell>
  );
}
