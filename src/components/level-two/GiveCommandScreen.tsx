"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackPanel } from "@/components/level-one/FeedbackPanel";
import { HintFloat } from "@/components/level-one/HintFloat";
import { vibrateForTap } from "@/lib/haptics";
import { fireRobot } from "@/lib/rive/robotHost";
import { COMMAND_ROBOT, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { HEX_SLOT, HexBubble } from "./HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { ROBOT_GAP, RobotBackdrop } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/** Once the cube is up (the robot's pick-up clip), this long until "Nice!" comes in. */
const NICE_AFTER_S = COMMAND_ROBOT.moveSeconds.pickUp + 0.45;
/** Hex's question stands this far above the hint and the button (the frame has it 240px up from the bottom); the robot rests above it. */
const QUESTION_ABOVE_BUTTONS = 118;
const QUESTION_BOTTOM = aboveButtons(QUESTION_ABOVE_BUTTONS, true);

/**
 * `/module?step=2` — "Let's make it happen!": Hex asks what to
 * tell the robot, the main button ("Pick Up", our usual one) gives the
 * instruction and the cube is picked up. Then, on this same screen, the title
 * becomes "Nice! Instruction given!", a panel with Hex says so above the
 * button, and the button becomes "Next". The hint points at Hex's question. The
 * button row stays as it is throughout (the hint stays, the button keeps its
 * look); while the cube is being picked up the button just takes no clicks.
 */
export function GiveCommandScreen() {
  const router = useRouter();
  const [given, setGiven] = useState(false);
  const [nice, setNice] = useState(false);
  const [hinted, setHinted] = useState(false);
  useEffect(() => {
    if (!given) return;
    const timer = window.setTimeout(() => setNice(true), NICE_AFTER_S * 1000);
    return () => window.clearTimeout(timer);
  }, [given]);

  return (
    <LevelTwoShell
      step={2}
      scene={<RobotBackdrop bottom={`calc(${QUESTION_BOTTOM} + ${HEX_SLOT + ROBOT_GAP}px)`} pose="idle" />}
      ctaLabel={nice ? "Next" : "Pick Up"}
      ctaLocked={given && !nice}
      hint={{ visible: true, onUse: () => !given && setHinted(true) }}
      onContinue={() => {
        if (nice) {
          router.push(levelTwoHref(3));
          return;
        }
        vibrateForTap();
        fireRobot("pickUp");
        setGiven(true);
      }}
      overlay={nice ? <NicePanel /> : undefined}
    >
      {nice ? (
        <ScreenTitle key="nice">
          Nice! <Teal>Instruction given!</Teal>
        </ScreenTitle>
      ) : (
        <ScreenTitle key="give">
          Let&apos;s make <Teal>it happen!</Teal>
        </ScreenTitle>
      )}
      {!given && (
        <CentredRow bottom={QUESTION_BOTTOM}>
          <HintFloat className="relative" spin={false} active={hinted}>
            <HexBubble
              entryKey="give-command"
              hex="left"
              size={{ width: 240 }}
              line={[{ text: "What instruction should we give the robot?" }]}
            />
          </HintFloat>
        </CentredRow>
      )}
    </LevelTwoShell>
  );
}

/** The "Yayyy!" panel with Hex, coming up from behind the Next button: the right-answer panel, with its own title. */
function NicePanel() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <FeedbackPanel correct title="Yayyy!" open hexIn hexCue={HEX_ONBOARDING_TRIGGER.continueThumb}>
        You gave an instruction. The robot performed an action.
      </FeedbackPanel>
    </div>
  );
}
