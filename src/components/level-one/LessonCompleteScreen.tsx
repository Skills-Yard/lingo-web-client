"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { Button3D } from "@/components/ui/Button3D";
import { playClickSound } from "@/components/onboarding/clickSound";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { LESSON_COMPLETE } from "@/lib/rive/runtime";

/** The lesson's results, shown by the artboard. */
const LESSON_XP = 40;
const LESSON_ACCURACY = 92;
/** The seconds the lesson took. */
const LESSON_SECONDS = 222;

const LAYOUT = new Layout({ fit: Fit.FitWidth, alignment: Alignment.Center });

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * `/module?level=1&step=complete` — "Lesson complete!": the "LESSON_Complete"
 * Rive artboard. Once it is ready, its `xp`, `accuracy` and `time` are set and
 * its `play` trigger fired. Each value is written as a number, or as display
 * text (`+40`, `92%`, `3:42`) if the artboard declares that property as a string.
 */
export function LessonCompleteScreen({ onContinue }: { onContinue?: () => void }) {
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
    set(LESSON_COMPLETE.accuracyProperty, LESSON_ACCURACY, `${LESSON_ACCURACY}%`);
    set(LESSON_COMPLETE.timeProperty, LESSON_SECONDS, formatTime(LESSON_SECONDS));
    fireTrigger(LESSON_COMPLETE.playTrigger);
  }, [rive, ready, fireTrigger]);

  return (
    <main className="onboarding-light relative h-dvh w-full overflow-hidden bg-white">
      <RiveComponent aria-hidden className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-9">
        <Button3D
          onClick={onContinue ?? (() => router.push("/level"))}
          onPress={playClickSound}
          className="w-full"
        >
          Continue
        </Button3D>
      </div>
    </main>
  );
}
