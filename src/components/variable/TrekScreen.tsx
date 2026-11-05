"use client";

import { useRouter } from "next/navigation";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, Teal } from "@/components/level-two/LevelTwoShell";
import { STEP, variableNext, variablePrevious, VARIABLE_STEPS } from "./variable";

/** The trail picture's place in the Figma frame: it hangs from under the title, 390 px wide. */
const PICTURE_TOP = 168;
const PICTURE_W = 390;
const PICTURE_H = 519;
const BUBBLE_TOP = 178;

/** Fades the picture into the page at its top and bottom. */
const FADE = "linear-gradient(180deg, transparent 0, #000 36px, #000 calc(100% - 140px), transparent 100%)";

/** The mountain trail behind the screen. */
export function TrekBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -z-10 flex justify-center"
      style={{ top: stageTop(PICTURE_TOP), maskImage: FADE, WebkitMaskImage: FADE }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/variable/trek-bg.webp" alt="" width={PICTURE_W} height={PICTURE_H} className="shrink-0 select-none" style={{ width: PICTURE_W, height: PICTURE_H }} draggable={false} />
    </div>
  );
}

/** "Let's go trekking today!": Hex tells what is about to happen over a picture of the trail. */
export function TrekScreen() {
  const router = useRouter();
  return (
    <LevelTwoShell
      step={STEP.trek}
      total={VARIABLE_STEPS}
      onBack={() => router.push(variablePrevious(STEP.trek))}
      scene={<TrekBackdrop />}
      onContinue={() => router.push(variableNext(STEP.trek))}
    >
      <ScreenTitle oneLine>
        Let’s go <Teal>trekking</Teal> today!
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble entryKey="trek" hex="left" line={[{ text: "You and your friends are off on a trek!" }]} size={{ width: 190 }} />
      </CentredRow>
    </LevelTwoShell>
  );
}
