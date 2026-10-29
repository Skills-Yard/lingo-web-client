"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { aboveButtons, FadeToWhite, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { levelTwoHref } from "./levelTwo";

/**
 * `/module?step=1` — "Meet your robot.": the LEARN chip, the chapter
 * and a line about the robot, over the picture fading out to white.
 */
export function MeetRobotScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={1} scene={<RobotScene from="table" />} ctaLabel="Continue" onContinue={() => router.push(levelTwoHref(2))}>
      <FadeToWhite />

      {/* The same chip as module 1's opening screen. */}
      <div className="absolute inset-x-0 flex justify-center" style={{ top: stageTop(113) }}>
        <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#2F80ED] bg-[#E5EFFD] py-[5px] pr-3 pl-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F80ED]">
            <BookOpen className="h-[13px] w-[13px] text-white" strokeWidth={2} />
          </span>
          <span className="text-xs leading-4 font-extrabold tracking-[1.2px] text-[#2F80ED] uppercase">Learn</span>
        </span>
      </div>
      <p
        className="absolute inset-x-0 text-center text-[11px] leading-4 font-bold tracking-[1.2px] text-[#1386B3] uppercase"
        style={{ top: stageTop(175) }}
      >
        Chapter 1 · Commands
      </p>
      <ScreenTitle at={202}>
        Meet your <Teal>robot.</Teal>
      </ScreenTitle>

      <p
        className="absolute text-center text-[16px] leading-[23px] font-medium text-[#444444]"
        style={{ bottom: aboveButtons(54), width: 372, left: "calc(50% - 186px)" }}
      >
        This robot can handle objects at its workstation. It can pick things up, put them down and place them where they&apos;re needed.
      </p>
    </LevelTwoShell>
  );
}
