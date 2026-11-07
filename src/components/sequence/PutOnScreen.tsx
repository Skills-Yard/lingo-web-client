"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "@/components/level-one/Confetti";
import { HexBubble } from "@/components/level-two/HexBubble";
import { CentredRow, LevelTwoShell, ScreenTitle, stageTop, TitleText } from "@/components/level-two/LevelTwoShell";
import type { BubbleSize, Span, TitleLines } from "@/components/level-two/levelTwo";
import { DressScene, type DressStage } from "./DressScene";
import { SEQUENCE_STEPS, STEP, sequenceNext, sequencePrevious } from "./sequence";

export type PutOnStage = "socks" | "shoes" | "ready";

type Config = { step: number; title: TitleLines; titleSize?: number; line: readonly Span[]; bubble: BubbleSize };

const CONFIG: Record<PutOnStage, Config> = {
  socks: {
    step: STEP.socks,
    title: [[{ text: "Let’s Put On " }, { text: "Socks!", teal: true }]],
    titleSize: 26,
    line: [{ text: "Socks are on. That’s the right first step!" }],
    bubble: { width: 190 },
  },
  shoes: {
    step: STEP.shoes,
    title: [[{ text: "Let’s Put On " }, { text: "Shoes!", teal: true }]],
    titleSize: 26,
    line: [{ text: "Socks are on. Now it is time for the shoes!" }],
    bubble: { width: 190 },
  },
  ready: {
    step: STEP.ready,
    title: [[{ text: "All " }, { text: "Set!", teal: true }]],
    line: [{ text: "Yay! You’re ready to go outside." }],
    bubble: { width: 190 },
  },
};

const BUBBLE_TOP = 150;
/** How long the screen's own animation and text take before Continue unlocks on the last one. */
const READY_MS = 3000;
/** How long the shoes going on is left to play before Continue unlocks. */
const SHOES_MS = 3000;

type Phase = "wait" | "playing" | "done";

/**
 * The three "Let's see what happens" screens: the character has his socks on from
 * the first screen, then (on a tap of "Put On Shoes") puts on his shoes, and is
 * ready to go. There is no question: the learner watches, and Continue unlocks
 * once anything there is to watch has played.
 */
export function PutOnScreen({ stage }: { stage: PutOnStage }) {
  const router = useRouter();
  const config = CONFIG[stage];
  const [phase, setPhase] = useState<Phase>(stage === "ready" ? "playing" : stage === "socks" ? "done" : "wait");
  const pending = useRef<number[]>([]);

  // The last screen plays on its own; the shoes wait for their button.
  useEffect(() => {
    const timers: number[] = [];
    if (stage === "ready") timers.push(window.setTimeout(() => setPhase("done"), READY_MS));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [stage]);

  useEffect(() => {
    const timers = pending.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const putOnShoes = () => {
    setPhase("playing");
    pending.current.push(window.setTimeout(() => setPhase("done"), SHOES_MS));
  };

  const onContinue = () => {
    if (stage === "shoes" && phase === "wait") putOnShoes();
    else router.push(sequenceNext(config.step));
  };

  const shoes: DressStage = stage === "ready" ? "worn" : stage === "socks" || phase === "wait" ? "rug" : phase === "playing" ? "hop" : "worn";

  return (
    <LevelTwoShell
      step={config.step}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(config.step))}
      scene={<DressScene socks="worn" shoes={shoes} happy={stage === "ready"} />}
      ctaLabel={stage === "shoes" && phase === "wait" ? "Put On Shoes" : "Continue"}
      ctaDisabled={stage === "shoes" ? phase === "playing" : phase !== "done"}
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
