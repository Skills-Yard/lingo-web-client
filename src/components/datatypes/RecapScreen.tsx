"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { aboveButtons, LevelTwoShell, ScreenTitle } from "@/components/level-two/LevelTwoShell";
import { fireSceneTrigger } from "@/lib/rive/datatypesHost";
import { COMPLETE_TEXT } from "@/lib/rive/runtime";
import { datatypesHref } from "@/lib/routes";
import { STEP, DATATYPES_STEPS, datatypesPrevious } from "./datatypes";
import { TITLE_END } from "./DataTypesScreen";
import { SceneBackdrop, sceneHeight } from "./scenes";
import { parseTitle } from "./screen";

/** The headline (the PDF's, cut to one line), set at a size that keeps it on one. */
const TITLE = { ...parseTitle("You unlocked *Data Types!*"), twoLines: false, size: 26 };

/** The clear space (px) between the scene's bottom edge and the closing thought under it. */
const GAP_BELOW_SCENE = 12;
/** How tall the closing thought is (px): three lines and its padding. */
const THOUGHT_H = 78;
/** The room between the title and the main button (the scene is centred in it). */
const ROOM_TOP = `${TITLE_END.one}px`;
const ROOM_BOTTOM = aboveButtons(20);
/** Where the scene starts (a CSS length, stage px): centred in the room, and never higher than the title's end. */
const SCENE_TOP = `max(${ROOM_TOP}, calc(${ROOM_TOP} + (100% - ${ROOM_TOP} - ${ROOM_BOTTOM} - ${sceneHeight}) / 2))`;
/**
 * The page behind this screen, drawn to meet the scene (read off it 2026-11-17): the scene's top edge is its wall, #E5ECFF, which the
 * usual soft backdrop (#F5F9FF there) leaves a visible band against, so this one reaches the wall's colour exactly where the scene starts
 * and goes on to the usual pale blue and white under it (where the scene's floor fades out).
 */
const BACKDROP = `linear-gradient(180deg, #EAF3FF 0, #E5ECFF ${SCENE_TOP}, #F7FAFF calc(${SCENE_TOP} + ${sceneHeight}), #FFFFFF 100%)`;
/** The scene plays its introduction, and then celebrates this long (ms) after the screen opens. */
const CELEBRATE_MS = 1800;
/** The artboard's central title: the file still has the Variable chapter's ("VARIABLES MASTER"). */
const SCENE_TEXTS = { [COMPLETE_TEXT.title]: "DATA TYPES MASTER" };

const FINAL_THOUGHT = "Before a program can work with information correctly, it needs to understand what kind of information it is.";

/**
 * "You Have Unlocked Data Types!": the four types around one idea, in the scene behind the screen (`DATATYPES_SCENES.complete`),
 * centred between the title and the button (there is no Hex bubble here), with the closing thought under it. "Complete
 * Chapter" opens the gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(datatypesHref("complete"));
  }, [router]);

  // Once the scene has put the types around the idea, it celebrates.
  useEffect(() => {
    const timer = window.setTimeout(() => fireSceneTrigger("complete", "celebrate"), CELEBRATE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LevelTwoShell
      step={STEP.recap}
      total={DATATYPES_STEPS}
      onBack={() => router.push(datatypesPrevious(STEP.recap))}
      scene={
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 dark:hidden" style={{ backgroundImage: BACKDROP }} />
          <SceneBackdrop scene="complete" values={{}} texts={SCENE_TEXTS} titleEnd={TITLE_END.one} top={SCENE_TOP} />
        </>
      }
      ctaLabel="Complete Chapter"
      onContinue={() => setGemOpen(true)}
      overlay={<GemPopup open={gemOpen} onClose={closeGem} />}
    >
      <ScreenTitle oneLine={!TITLE.twoLines}>
        <span style={{ fontSize: TITLE.size }}>
          {TITLE.parts.map((part, index) =>
            index % 2 === 1 ? (
              <span key={index} className="text-level-gradient">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      </ScreenTitle>

      {/* Right under the scene's bottom edge, or higher where that would run down behind the button. */}
      <div
        className="absolute left-1/2 w-[340px] -translate-x-1/2"
        style={{ top: `min(calc(${SCENE_TOP} + ${sceneHeight} + ${GAP_BELOW_SCENE}px), calc(100% - ${aboveButtons(8)} - ${THOUGHT_H}px))` }}
      >
        <p className="flex items-start gap-2 rounded-[14px] bg-[#F1EEFF] px-4 py-3 text-[13px] leading-[18px] font-semibold text-[#444444] dark:bg-[#23204A] dark:text-white">
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[#6D4FE0] dark:text-[#A79BFF]" />
          {FINAL_THOUGHT}
        </p>
      </div>
    </LevelTwoShell>
  );
}
