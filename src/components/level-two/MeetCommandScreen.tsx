"use client";

import { useRouter } from "next/navigation";
import { AudioPlayer, COMMAND_AUDIO } from "./AudioPlayer";
import { aboveButtons, FadeToWhite, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { levelTwoHref } from "./levelTwo";

/**
 * `/module?level=2&step=9` — "Meet the Command.": the picture fading out to
 * white, a voice clip to play, and what instructions are known as.
 */
export function MeetCommandScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={9} scene={<RobotScene from="table" />} ctaLabel="Next" onContinue={() => router.push(levelTwoHref(10))}>
      <FadeToWhite />
      <ScreenTitle>
        Meet the <Teal>Command.</Teal>
      </ScreenTitle>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(514) }}>
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
