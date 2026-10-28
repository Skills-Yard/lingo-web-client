"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { playClickSound } from "@/components/onboarding/clickSound";
import { ActionRow } from "@/components/level-one/ActionRow";
import { LevelOneShell } from "@/components/level-one/LevelOneShell";
import { vibrateForTap } from "@/lib/haptics";
import { CommandButton } from "./CommandButton";
import { HexSays } from "./HexSays";
import { ResultCard } from "./ResultCard";
import { RobotScene } from "./RobotScene";
import { LEG_S, LEVEL_TWO_STEPS, levelTwoHref, RESULT_AFTER_S, ROUNDS } from "./rounds";

/**
 * `/module?level=2&step=1…3` — "Your turn to give an instruction!": Hex asks
 * for a command, the learner gives it (the one button), the robot arm's cube
 * does it, and a card says what the instruction did before Continue.
 */
export function CommandScreen({ round }: { round: number }) {
  const router = useRouter();
  const { line, command, from, moves, result } = ROUNDS[round - 1];
  // Given: the cube is on its way. Done: it has arrived and the card is up.
  const [given, setGiven] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!given) return;
    const timer = window.setTimeout(() => setDone(true), (moves.length * LEG_S + RESULT_AFTER_S) * 1000);
    return () => window.clearTimeout(timer);
  }, [given, moves.length]);

  const next = () => router.push(levelTwoHref(round < LEVEL_TWO_STEPS ? round + 1 : "complete"));
  const give = () => {
    playClickSound();
    vibrateForTap();
    setGiven(true);
  };

  return (
    <LevelOneShell
      step={round}
      total={LEVEL_TWO_STEPS}
      onBack={() => router.push(round > 1 ? levelTwoHref(round - 1) : "/level")}
      action={
        <div className="relative z-10 w-full shrink-0">
          <AnimatePresence>{done && <ResultCard key="result">{result}</ResultCard>}</AnimatePresence>
          {done ? (
            <ActionRow maxWidth={450} ctaLabel="Continue" onContinue={next} />
          ) : (
            <CommandButton command={command} disabled={given} onPress={give} />
          )}
        </div>
      }
    >
      <RobotScene from={from} moves={moves} go={given} />
      <motion.h1
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.15 }}
        className="mt-4 w-full text-[26px] leading-[34px] font-semibold text-[#1F2A44]"
      >
        Your turn to give an
        <br />
        <span className="text-level-gradient">instruction!</span>
      </motion.h1>
      <HexSays entryKey={`command-${round}`} line={line} cheer={done} />
    </LevelOneShell>
  );
}
