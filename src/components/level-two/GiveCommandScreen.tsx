"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Fredoka } from "next/font/google";
import { OnboardingHex } from "@/components/level-one/FeedbackPanel";
import { HintFloat } from "@/components/level-one/HintFloat";
import { vibrateForTap } from "@/lib/haptics";
import { HEX_ONBOARDING_TRIGGER } from "@/lib/rive/runtime";
import { HexBubble } from "./HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { LEG_S, levelTwoHref } from "./levelTwo";

const fredoka = Fredoka({ subsets: ["latin"], weight: "600" });

/** Once the cube is up, this long until "Nice!" comes in. */
const NICE_AFTER_S = LEG_S + 0.45;
/** Hex enters a touch after the panel, and his thumbs-up follows his entrance. */
const HEX_AFTER_MS = 250;
const HEX_SETTLE_MS = 900;
/** Figma: the panel's top edge is 593px down the frame. */
const PANEL_MIN_HEIGHT = 844 - 593;

/**
 * `/module?step=2` — "Let's make something happen!": Hex asks what to
 * tell the robot, the main button ("Pick Up", our usual one) gives the
 * instruction and the cube is picked up. Then, on this same screen, the title
 * becomes "Nice! You gave an instruction.", a panel with Hex says so above the
 * button, and the button becomes "Next". The hint points at Hex's question.
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
      scene={<RobotScene from="table" moves={["held"]} go={given} />}
      ctaLabel={nice ? "Next" : "Pick Up"}
      ctaDisabled={given && !nice}
      hint={given ? undefined : { visible: true, onUse: () => setHinted(true) }}
      onContinue={() => {
        if (nice) {
          router.push(levelTwoHref(3));
          return;
        }
        vibrateForTap();
        setGiven(true);
      }}
      overlay={nice ? <NicePanel /> : undefined}
    >
      {nice ? (
        <ScreenTitle key="nice">
          Nice!
          <br />
          <Teal>You gave an instruction.</Teal>
        </ScreenTitle>
      ) : (
        <ScreenTitle key="give">
          Let&apos;s make
          <br />
          <Teal>something happen!</Teal>
        </ScreenTitle>
      )}
      {!given && (
        <CentredRow bottom={240}>
          <HintFloat className="relative" spin={false} active={hinted}>
            <HexBubble
              entryKey="give-command"
              hex="left"
              size={{ width: 240 }}
              line={[{ text: "Cube is right in front of the robot. What instruction should we give it?" }]}
            />
          </HintFloat>
        </CentredRow>
      )}
    </LevelTwoShell>
  );
}

/** The "Yayyy!" panel with Hex, coming up from behind the Next button. */
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
        // Figma's panel is 251 tall (top at 593); the button is drawn taller here
        // (and taller still on a wide screen), so the panel reaches 10px above it.
        style={{ maxWidth: "calc(1024px / var(--stage-scale, 1))", minHeight: PANEL_MIN_HEIGHT, paddingBottom: aboveButtons(10) }}
        className="absolute inset-x-0 bottom-0 z-0 mx-auto flex justify-center rounded-t-[28px] border-[1.5px] border-b-0 border-[#08A2AD] bg-[#DFFFF8] pt-[22px] dark:border-[#1E5F59] dark:bg-[#0F2B28]"
      >
        <div className="flex h-fit w-[290px] items-center justify-between">
          <div className="flex w-[180px] flex-col gap-1.5">
            <h2 className={`${fredoka.className} text-[17px] leading-6 font-semibold text-[#01A17F]`}>Yayyy!</h2>
            <p className="text-[14px] leading-[1.4] font-medium text-[#444444] dark:text-white/80">
              You gave an instruction. The robot performed an action.
            </p>
          </div>
          <div aria-hidden className="-my-4 h-[112px] w-[110px] shrink-0">
            <OnboardingHex entryKey={hexIn ? "nice" : null} cue={hexIn ? HEX_ONBOARDING_TRIGGER.continueThumb : null} cueDelayMs={HEX_SETTLE_MS} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
