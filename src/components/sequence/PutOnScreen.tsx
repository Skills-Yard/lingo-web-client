"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import type { BubbleSize, Span, TitleLines } from "@/components/level-two/levelTwo";
import { DressScene, HOP_SECONDS, type DressStage } from "./DressScene";
import { SEQUENCE_STEPS, SOCKS_ON_SHOES_ON, STEP, sequenceNext, sequencePrevious } from "./sequence";

export type PutOnStage = "socks" | "shoes" | "ready";

type Config = { step: number; title: TitleLines; titleSize?: number; line: readonly Span[]; bubble: BubbleSize };

const CONFIG: Record<PutOnStage, Config> = {
  socks: {
    step: STEP.socks,
    title: [[{ text: "Let’s Put On " }, { text: "Socks First!!", teal: true }]],
    titleSize: 26,
    line: [{ text: "Watch what happens when you put on your socks first." }],
    bubble: { width: 190 },
  },
  shoes: {
    step: STEP.shoes,
    title: [[{ text: "Let’s Put On " }, { text: "Shoes Now!!", teal: true }]],
    titleSize: 26,
    line: [{ text: "Socks are on. Now it is time for the shoes!" }],
    bubble: { width: 190 },
  },
  ready: {
    step: STEP.ready,
    title: [[{ text: "Ready to " }, { text: "Go", teal: true }, { text: " Now" }]],
    line: [{ text: "Yeah! You are now ready to go outside." }],
    bubble: { width: 190 },
  },
};

const BUBBLE_TOP = 150;
/** The picture of the result, in front of the scene (Figma `top`). */
const CLOSE_UP = { src: SOCKS_ON_SHOES_ON, width: 285, top: 262 };
/** The pause before the socks start to move, and after they land. */
const SOCKS_WAIT_MS = 900;
const LAND_MS = 700;
/** How long the screen's own animation and text take before Continue unlocks on the last one. */
const READY_MS = 3000;

type Phase = "wait" | "hop" | "closeUp" | "done";

/**
 * The three "Let's see what happens" screens: the character puts on his socks,
 * then (on a tap of "Put On Shoes") his shoes, and is ready to go. There is no
 * question: the learner watches, and Continue unlocks once it has played.
 */
export function PutOnScreen({ stage }: { stage: PutOnStage }) {
  const router = useRouter();
  const config = CONFIG[stage];
  const [phase, setPhase] = useState<Phase>(stage === "ready" ? "closeUp" : "wait");
  const pending = useRef<number[]>([]);

  // The socks and the last screen play on their own; the shoes wait for their button.
  useEffect(() => {
    const timers: number[] = [];
    if (stage === "socks") {
      timers.push(window.setTimeout(() => setPhase("hop"), SOCKS_WAIT_MS));
      timers.push(window.setTimeout(() => setPhase("done"), SOCKS_WAIT_MS + HOP_SECONDS * 1000 + LAND_MS));
    }
    if (stage === "ready") timers.push(window.setTimeout(() => setPhase("done"), READY_MS));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [stage]);

  useEffect(() => {
    const timers = pending.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const putOnShoes = () => {
    setPhase("hop");
    pending.current.push(window.setTimeout(() => setPhase("closeUp"), HOP_SECONDS * 1000 + LAND_MS));
    pending.current.push(window.setTimeout(() => setPhase("done"), HOP_SECONDS * 1000 + LAND_MS + 1300));
  };

  const onContinue = () => {
    if (stage === "shoes" && phase === "wait") putOnShoes();
    else router.push(sequenceNext(config.step));
  };

  const lifted = (running: DressStage): DressStage => (phase === "wait" ? "rug" : phase === "hop" ? running : "worn");
  const socks: DressStage = stage === "socks" ? lifted("hop") : "worn";
  const shoes: DressStage = stage === "shoes" ? lifted("hop") : stage === "ready" ? "worn" : "rug";
  const showCloseUp = stage === "ready" || (stage === "shoes" && (phase === "closeUp" || phase === "done"));

  return (
    <LevelTwoShell
      step={config.step}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(config.step))}
      scene={<DressScene socks={socks} shoes={shoes} closeUp={showCloseUp ? CLOSE_UP : null} bounce={stage === "ready"} />}
      ctaLabel={stage === "shoes" && phase === "wait" ? "Put On Shoes" : "Continue"}
      ctaDisabled={stage === "shoes" ? phase === "hop" || phase === "closeUp" : phase !== "done"}
      onContinue={onContinue}
    >
      <ScreenTitle oneLine>
        <span style={config.titleSize ? { fontSize: config.titleSize } : undefined}>
          <TitleText lines={config.title} />
        </span>
      </ScreenTitle>
      <CentredRow top={stageTop(BUBBLE_TOP)}>
        <HexBubble entryKey={`put-on-${stage}`} hex="left" line={config.line} size={config.bubble} />
      </CentredRow>
      <Confetti active={stage === "ready"} />
    </LevelTwoShell>
  );
}
