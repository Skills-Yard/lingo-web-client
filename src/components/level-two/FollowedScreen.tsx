"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HintFloat } from "@/components/level-one/HintFloat";
import { HexBubble } from "./HexBubble";
import { aboveButtons, CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "./LevelTwoShell";
import { RobotScene } from "./RobotScene";
import { SlotImage } from "./SlotImage";
import { levelTwoHref } from "./levelTwo";

/** Figma's card ends 30px above its button (692 / 722); here, above the hint. */
const GAP_ABOVE_BUTTONS = 20;

/**
 * `/module?level=2&step=12` — "The robot followed your instruction.": Hex says
 * what MOVE did, and a card says what the instruction is.
 */
export function FollowedScreen() {
  const router = useRouter();
  const [hinted, setHinted] = useState(false);

  return (
    <LevelTwoShell
      step={12}
      scene={<RobotScene from="table" />}
      ctaLabel="Next"
      hint={{ visible: true, onUse: () => setHinted(true) }}
      onContinue={() => router.push(levelTwoHref(13))}
    >
      <ScreenTitle>
        <Teal>The robot followed</Teal>
        <br />
        your instruction.
      </ScreenTitle>
      <CentredRow top={stageTop(197)}>
        <HexBubble
          entryKey="followed"
          hex="left"
          size={{ width: 216 }}
          line={[
            { text: "When you selected " },
            { text: "MOVE", teal: true },
            { text: ", the robot moved the cube to the table." },
          ]}
        />
      </CentredRow>

      <div className="pointer-events-auto absolute w-[358px]" style={{ bottom: aboveButtons(GAP_ABOVE_BUTTONS, true), left: "calc(50% - 179px)" }}>
        <HintFloat className="w-full" spin={false} active={hinted}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.5 }}
            className={`flex h-[112px] w-full items-center gap-[15px] rounded-[18px] pr-2 pl-[22px] shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-[background-color,box-shadow] duration-500 ${
              hinted ? "bg-[#FFF3E8] shadow-[0_0_14px_2px_rgba(255,141,66,0.25)]" : "bg-white"
            }`}
          >
            {/* The cube -> table picture's slot. */}
            <div className="flex h-14 w-[136px] shrink-0 items-center justify-center">
              <SlotImage file="step-6.1.svg" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="w-[168px] shrink-0 text-[14px] leading-[22px] font-medium text-[#444444]">
              MOVE is an instruction. It tells the robot to move the cube to a new location.
            </p>
          </motion.div>
        </HintFloat>
      </div>
    </LevelTwoShell>
  );
}
