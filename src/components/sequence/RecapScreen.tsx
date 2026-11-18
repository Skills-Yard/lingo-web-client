"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Maximize, Play, Sparkles } from "lucide-react";
import { GemPopup } from "@/components/level-one/GemPopup";
import { LevelTwoShell, ScreenTitle, SoftBackdrop } from "@/components/level-two/LevelTwoShell";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED } from "@/components/ui/raised";
import { sequenceHref } from "@/lib/routes";
import { SEQUENCE_STEPS, STEP, sequencePrevious } from "./sequence";
import { SequenceRoom } from "./SequenceRoom";

const LEARNED = [
  "Tasks can need many commands.",
  "Order can change the result.",
  "Some actions need earlier ones.",
  "A good sequence reaches the goal.",
];
/** Stage px down (the title ends at about 117). */
const VIDEO_TOP = 140;
const VIDEO_HEIGHT = 190;
const LEARNED_TOP = 350;

/**
 * "You've mastered Sequence!": the summary video's place, laid out like the first
 * lesson's video screen (its player doesn't play anything yet), and what the
 * learner took from the module. Continue opens the gem popup, then "Lesson complete!".
 */
export function RecapScreen() {
  const router = useRouter();
  const [gemOpen, setGemOpen] = useState(false);
  const closeGem = useCallback(() => {
    setGemOpen(false);
    router.push(sequenceHref("complete"));
  }, [router]);

  return (
    <LevelTwoShell
      step={STEP.recap}
      total={SEQUENCE_STEPS}
      onBack={() => router.push(sequencePrevious(STEP.recap))}
      scene={<SoftBackdrop />}
      onContinue={() => setGemOpen(true)}
      overlay={<GemPopup open={gemOpen} onClose={closeGem} />}
    >
      <ScreenTitle oneLine>
        <span className="text-[26px]">
          You’ve <span className="text-level-gradient">mastered</span> Sequence!
        </span>
      </ScreenTitle>

      <div className="absolute left-1/2 w-[340px] -translate-x-1/2" style={{ top: VIDEO_TOP }}>
        <div className="relative w-full" style={{ height: VIDEO_HEIGHT }}>
          <div aria-hidden className="absolute inset-0 bg-[#79DDFF]/24 blur-[60px]" />
          <div role="img" aria-label="A boy getting ready to go out" className="absolute inset-0 overflow-hidden rounded-lg">
            <SequenceRoom dress="dressed" happy fit="cover" />
          </div>
          <button
            type="button"
            aria-label="Play video"
            onClick={playClickSound}
            className={`pointer-events-auto absolute top-[56px] left-1/2 flex h-[69px] w-[69px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[#F0F0FF] bg-white ${RAISED} ${EDGE.pale}`}
          >
            <Play className="ml-1 h-[26px] w-[26px] fill-[#00B8A9] text-[#00B8A9]" />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex h-12 items-center gap-[9px] rounded-b-lg bg-black/65 px-[15px] backdrop-blur-[3.35px]">
            <Play className="h-3.5 w-3.5 shrink-0 fill-white text-white" />
            <span className="text-[12px] leading-[18px] text-white tabular-nums">00:00</span>
            <span className="relative h-[11px] min-w-0 flex-1">
              <span className="absolute inset-x-0 top-[4px] h-[3px] rounded-full bg-[#818185]" />
              <span className="absolute top-0 left-0 h-[11px] w-[11px] rounded-full bg-[#01A17F]" />
            </span>
            <span className="text-[12px] leading-[18px] text-white tabular-nums">01:00</span>
            <Maximize className="h-[17px] w-[17px] shrink-0 text-white" />
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 w-[340px] -translate-x-1/2" style={{ top: LEARNED_TOP }}>
        <div className="flex gap-3 rounded-lg bg-[#B286FD]/11 px-3 py-4">
          <Sparkles className="mt-0.5 h-[34px] w-[34px] shrink-0 text-[#8E82FF]" strokeWidth={1.5} />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-[14px] leading-[21px] font-bold text-[#8859FC]">Today, you learned that:</span>
            <ul className="flex flex-col gap-1.5">
              {LEARNED.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[14px] leading-5 font-medium text-[#555555] dark:text-white/80">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-[#04ACAB]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </LevelTwoShell>
  );
}
