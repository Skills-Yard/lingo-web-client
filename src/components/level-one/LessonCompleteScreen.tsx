"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { buttonBottomMargin } from "@/components/level-one/ActionRow";
import { Button3D } from "@/components/ui/Button3D";
import { playClickSound } from "@/components/onboarding/clickSound";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { LESSON_COMPLETE } from "@/lib/rive/runtime";
import { vibrateForLessonComplete } from "@/lib/haptics";
import { completeModule } from "@/lib/levelProgress";
import { firstTryAccuracy, resetReview } from "@/lib/moduleReview";

/** The lesson's results, shown by the artboard. */
const LESSON_XP = 40;
/** The seconds the lesson took. */
const LESSON_SECONDS = 222;

/** The widest phone (px) — past it the screen stops growing. */
const PHONE_MAX_W = 430;

const LAYOUT =new Layout({ fit: Fit.FitWidth, alignment: Alignment.Center });

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * `/module?step=complete` — "Lesson complete!": the "LESSON_Complete"
 * Rive artboard. Once it is ready, its `xp`, `accuracy` (the share of questions
 * answered right the first time) and `time` are set and
 * its `play` trigger fired. Each value is written as a number, or as display
 * text (`+40`, `92%`, `3:42`) if the artboard declares that property as a string.
 * Continue records module `level` as finished and goes back to the path,
 * where Hex moves on to the next block.
 */
export function LessonCompleteScreen({ level = 1, onContinue }: { level?: number; onContinue?: () => void }) {
  const router = useRouter();
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
    const accuracy = firstTryAccuracy();
    set(LESSON_COMPLETE.accuracyProperty, accuracy, `${accuracy}%`);
    set(LESSON_COMPLETE.timeProperty, LESSON_SECONDS, formatTime(LESSON_SECONDS));
    fireTrigger(LESSON_COMPLETE.playTrigger);
    vibrateForLessonComplete();
  }, [rive, ready, fireTrigger]);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white">
      {/* The artboard fits the width, so it is held to a phone's width: on a
        desktop it stays the same size and sits in the middle. */}
      {/* The cap is on this box, not on `RiveComponent`: it drops its `style`
        whenever it has a `className`. */}
      <div className="absolute inset-y-0 left-1/2 w-full -translate-x-1/2" style={{ maxWidth: PHONE_MAX_W }}>
        <RiveComponent aria-hidden className="h-full w-full" />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 z-10 mx-auto px-4"
        style={{ maxWidth: PHONE_MAX_W, marginBottom: buttonBottomMargin(`(min(100vw, ${PHONE_MAX_W}px) - 32px)`) }}
      >
        <Button3D
          riveVariant="module"
          onClick={onContinue ?? (() => {
            completeModule(level);
            resetReview();
            router.push("/level");
          })}
          onPress={playClickSound}
          className="w-full"
        >
          Continue
        </Button3D>
      </div>
    </main>
  );
}
