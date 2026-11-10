"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MODULE_AUDIO } from "@/lib/moduleAudio";
import {
  CENTRED_HEX_BOX,
  CENTRED_HEX_SLOT,
  GROUPED_ROW,
  GROUPED_TEXT,
  OnboardingHex,
  SHEET_TITLE_SIZE,
} from "@/components/level-one/FeedbackPanel";
import { vibrateForTap } from "@/lib/haptics";
import { fireRobot, resetRobot } from "@/lib/rive/robotHost";
import { COMMAND_ROBOT, HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { HEX_SLOT, HexBubble } from "./HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { ROBOT_GAP, RobotBackdrop } from "./RobotBackdrop";
import { levelTwoHref } from "./levelTwo";

/** Once the cube is up (the robot's pick-up clip), this long until "Nice!" comes in. */
const NICE_AFTER_S = COMMAND_ROBOT.moveSeconds.pickUp + 0.45;
/** Hex's question stands this far above the button (the frame has it 240px up from the bottom); the robot rests above it. */
const QUESTION_ABOVE_BUTTONS = 118;
const QUESTION_BOTTOM = aboveButtons(QUESTION_ABOVE_BUTTONS);
/** Hex enters a touch after the panel, and his thumbs-up follows his entrance. */
const HEX_AFTER_MS = 250;
const HEX_SETTLE_MS = 900;
/** Figma "Frame 348": the panel's top edge is 608px down the frame, 236px tall. */
const PANEL_MIN_HEIGHT = 844 - 608;

/**
 * `/module/commands?step=2` — "Let's make it happen!": Hex asks what to
 * tell the robot, the main button ("Pick Up", our usual one) gives the
 * instruction and the cube is picked up. Then, on this same screen (the title
 * stays), a panel with Hex says so above the
 * button, and the button becomes "Next". The button row stays as it is
 * throughout (the button keeps its look); while the cube is being picked up
 * the button just takes no clicks.
 */
export function GiveCommandScreen() {
  const router = useRouter();
  const [given, setGiven] = useState(false);
  const [nice, setNice] = useState(false);
  // Opened again (Back, or from the next screen): the robot starts from rest every time.
  useEffect(() => {
    resetRobot();
  }, []);
  useEffect(() => {
    if (!given) return;
    const timer = window.setTimeout(() => setNice(true), NICE_AFTER_S * 1000);
    return () => window.clearTimeout(timer);
  }, [given]);

  return (
    <LevelTwoShell
      step={2}
      voiceover={MODULE_AUDIO.giveInstruction}
      scene={<RobotBackdrop bottom={`calc(${QUESTION_BOTTOM} + ${HEX_SLOT + ROBOT_GAP}px)`} pose="idle" />}
      ctaLabel={nice ? "Next" : "Pick Up"}
      ctaLocked={given && !nice}
      ctaLight={!nice}
      ctaWaitsForVoice
      ctaCube={!nice}
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
      <ScreenTitle>
        Give an <Teal>instruction</Teal>
      </ScreenTitle>
      {!given && (
        <CentredRow bottom={QUESTION_BOTTOM}>
          <HexBubble
            entryKey="give-command"
            hex="left"
            size={{ width: 240 }}
            line={[{ text: "Give " }, { text: "instruction", teal: true }, { text: " to " }, { text: "Pick Up", teal: true }, { text: " the Cube" }]}
          />
        </CentredRow>
      )}
    </LevelTwoShell>
  );
}

/** The "Yayyy!" panel with Hex, coming up from behind the Next button: the right-answer panel, with its own title. */
function NicePanel() {
  const [hexIn, setHexIn] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setHexIn(true), HEX_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Behind the Next button, like Level 1's result panel (the button row is z-10). */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        // 5xl on screen, like the header; the stage is scaled, so divide.
        // Figma's panel is 236 tall (top at 608); the button is drawn taller here
        // (and taller still on a wide screen), so the panel reaches 10px above it.
        style={{ maxWidth: "calc(1024px / var(--stage-scale, 1))", minHeight: PANEL_MIN_HEIGHT, paddingBottom: aboveButtons(10) }}
        className={`absolute inset-x-0 bottom-0 z-0 mx-auto flex rounded-t-[28px] border-[1.5px] border-b-0 border-[#08A2AD] bg-[#DFFFF8] pt-[16.5px] dark:border-[#1E5F59] dark:bg-[#0F2B28]`}
      >
        {/* The same row as the right-answer sheet (see FeedbackPanel `grouped`): 170px of text, 34px, Hex. */}
        <div className={`${GROUPED_ROW} h-fit min-h-[94px] w-[299.65px]`}>
          <div className={`${GROUPED_TEXT} w-[170px]`}>
            <h2 className={`truncate font-semibold tracking-[-0.1px] text-[#01A17F] ${SHEET_TITLE_SIZE}`}>Yayyy!</h2>
            <p className="line-clamp-3 text-[14px] leading-[1.4] font-medium break-words text-[#444444] dark:text-white/80">
              You gave an instruction and the robot did it.
            </p>
          </div>
          <div aria-hidden className={CENTRED_HEX_SLOT}>
            <div className={CENTRED_HEX_BOX}>
              <OnboardingHex entryKey={hexIn ? "nice" : null} cue={hexIn ? HEX_ONBOARDING_TRIGGER.continueThumb : null} cueDelayMs={HEX_SETTLE_MS} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
