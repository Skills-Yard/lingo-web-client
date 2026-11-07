"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { LESSON_COMPLETE } from "@/lib/rive/runtime";
import { vibrateForLessonComplete } from "@/lib/haptics";
import { completeModule } from "@/lib/levelProgress";
import { firstTryAccuracy, resetReview } from "@/lib/moduleReview";
import { RewardScreen } from "./RewardScreen";
import { PHONE_MAX_W, SoloContinue } from "./SoloContinue";

/** The lesson's results, shown by the artboard. */
const LESSON_XP = 40;
/** The seconds the lesson took. */
const LESSON_SECONDS = 222;

const LAYOUT =new Layout({ fit: Fit.FitWidth, alignment: Alignment.Center });

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * `/module?step=complete` — "Lesson complete!", then the reward: Continue on the
 * results records module `level` as finished and opens the reward chest
 * (`RewardScreen`); Continue there goes back to the path (or runs `onContinue`),
 * where Hex moves on to the next block.
 */
export function LessonCompleteScreen({
  level = 1,
  accuracy,
  onContinue,
}: {
  level?: number;
  /** Reads the share (0-100) of questions answered right the first time. */
  accuracy?: () => number;
  /** What Continue on the reward screen does, instead of going back to the path. */
  onContinue?: () => void;
}) {
  const router = useRouter();
  const [rewarding, setRewarding] = useState(false);

  if (rewarding) {
    return (
      <RewardScreen
        onContinue={
          onContinue ??
          (() => {
            resetReview();
            router.push("/level");
          })
        }
      />
    );
  }
  return (
    <LessonResults
      accuracy={accuracy}
      onContinue={() => {
        completeModule(level);
        setRewarding(true);
      }}
    />
  );
}

/**
 * The "LESSON_Complete" Rive artboard. Once it is ready, its `xp`, `accuracy`
 * (the share of questions answered right the first time) and `time` are set and
 * its `play` trigger fired. Each value is written as a number, or as display
 * text (`+40`, `92%`, `3:42`) if the artboard declares that property as a string.
 */
function LessonResults({ accuracy: readAccuracy = firstTryAccuracy, onContinue }: { accuracy?: () => number; onContinue: () => void }) {
  const { rive, RiveComponent, ready, fireTrigger } = useHexRive(
    LAYOUT,
    LESSON_COMPLETE.stateMachine,
    LESSON_COMPLETE.artboard,
    LESSON_COMPLETE.viewModel,
  );

  useEffect(() => {
    const instance = rive?.viewModelInstance;
    if (!ready || !instance) return;
    const set = (name: string, value: number, text: string) => {
      const number = instance.number(name);
      if (number) number.value = value;
      else {
        const string = instance.string(name);
        if (string) string.value = text;
      }
    };
    set(LESSON_COMPLETE.xpProperty, LESSON_XP, `+${LESSON_XP}`);
    // The questions answered right the first time, of all of them.
    const accuracy = readAccuracy();
    set(LESSON_COMPLETE.accuracyProperty, accuracy, `${accuracy}%`);
    set(LESSON_COMPLETE.timeProperty, LESSON_SECONDS, formatTime(LESSON_SECONDS));
    fireTrigger(LESSON_COMPLETE.playTrigger);
    vibrateForLessonComplete();
  }, [rive, ready, fireTrigger, readAccuracy]);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white dark:bg-background">
      {/* The artboard fits the width, so it is held to a phone's width: on a
        desktop it stays the same size and sits in the middle. */}
      {/* The cap is on this box, not on `RiveComponent`: it drops its `style`
        whenever it has a `className`. */}
      <div className="absolute inset-y-0 left-1/2 w-full -translate-x-1/2" style={{ maxWidth: PHONE_MAX_W }}>
        <RiveComponent aria-hidden className="h-full w-full" />
      </div>
      <SoloContinue onClick={onContinue} />
    </main>
  );
}
