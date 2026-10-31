"use client";

import { useRouter } from "next/navigation";
import { aboveButtons, LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { RobotBackdrop, robotAbove } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/** The line about the robot: its gap above the button row and its height (two lines). */
const TEXT_GAP = 54;
const TEXT_H = 46;

/**
 * `/module?step=1` — "Meet your robot.": the title and a line about the
 * robot, with the robot resting above that line.
 */
export function MeetRobotScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell step={1} scene={<RobotBackdrop bottom={robotAbove(TEXT_GAP + TEXT_H)} pose="idle" />} ctaLabel="Continue" onContinue={() => router.push(levelTwoHref(2))}>
      <ScreenTitle>
        Meet your <Teal>robot.</Teal>
      </ScreenTitle>

      <p
        className="absolute text-center text-[16px] leading-[23px] font-medium text-[#444444]"
        style={{ bottom: aboveButtons(TEXT_GAP), width: 372, left: "calc(50% - 186px)" }}
      >
        This robot can pick things up, put them down and place them where needed.
      </p>
    </LevelTwoShell>
  );
}
