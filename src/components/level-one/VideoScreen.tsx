"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { OnboardingHex } from "./FeedbackPanel";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { SpokenText } from "./SpokenText";
import type { TextSpan } from "@/lib/constants/onboarding";

const HEADING: TextSpan[] = [{ text: "What are " }, { text: "instructions", highlight: true }, { text: "?" }];
/** When What / are / instructions are spoken in screen_6_audio.mpeg, measured from the clip. Its progress runs against the whole 6.41s file, though only the first 2.15s plays. */
const HEADING_TIMING = { clipSeconds: 6.408, times: [[0.49, 0.76], [0.76, 1.12], [1.12, 1.72]], before: 0 } as const;

/** Hex's exit starts, then the next screen opens after this beat
 * without waiting for the exit to finish. */
const EXIT_MS = 700;

/** Only "What are instructions?" — the clip carries the next screen's question
 * too, which ends the pause 2.15s in. */
const VIDEO_AUDIO = ["/audios/screen_6_audio.mpeg#end=2.15"];

/**
 * `/module?level=1&step=6` — "What are instructions?": Hex asks, and a short
 * video (thumbnail, duration, caption) answers it.
 */
export function VideoScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <LevelOneShell
      step={6}
      wash
      voiceover={VIDEO_AUDIO}
      onBack={() => router.push(levelOneHref(5))}
      ctaDisabled={leaving}
      onContinue={() => {
        // Hex leaves first, then the next screen opens.
        setLeaving(true);
        window.setTimeout(() => (onContinue ?? (() => router.push(levelOneHref(7))))(), EXIT_MS);
      }}
    >
      {/* Hex and his question (plain heading text, as on the other screens): 20px under the header, 20px above the video. */}
      <div className="relative mt-5 mb-5 flex h-[95px] shrink-0 items-start justify-center gap-8">
        {/* The row keeps Hex's 131px slot. His canvas is as wide as the screen
          (centred on the screen, then shifted so he stands on his slot), so
          his exit can run right to the screen's edge without being cut off.
          It is only 150px tall, so he is drawn the size he has elsewhere. */}
        <div aria-hidden className="h-[95px] w-[131px] shrink-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-[100] h-[150px] -translate-y-1/2"
          style={{ width: "var(--stage-w)", left: "calc(50% - var(--stage-w) / 2 - 91.5px)" }}
        >
          <OnboardingHex entryKey="video" leaving={leaving} exit="exitLeft" />
        </div>
        <h2 className="w-[175px] shrink-0 self-center text-[30px] leading-9 font-semibold text-[#2C2C2C] dark:text-white">
          <SpokenText spans={HEADING} timing={HEADING_TIMING} />
        </h2>
      </div>

      <div className="relative h-[282px] w-full shrink-0">
        <div aria-hidden className="absolute inset-0 bg-[#79DDFF]/24 blur-[75px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/level-one/video-thumbnail.png"
          alt="A laptop, a mug and a pen holder on a desk"
          draggable={false}
          className="relative h-full w-full rounded-lg border-[2.5px] border-[#1386B3] object-cover"
        />
        <button
          type="button"
          aria-label="Play video"
          onClick={playClickSound}
          className="absolute top-1/2 left-1/2 flex h-[69px] w-[69px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white shadow-[1px_1px_13.2px_3px_rgba(0,0,0,0.25)] transition-transform active:scale-95"
        >
          <Play className="ml-1 h-[26px] w-[26px] fill-[#00B8A9] text-[#00B8A9]" />
        </button>
      </div>

      <div className="mt-[22px] flex h-[42px] w-full shrink-0 items-center justify-between rounded-lg bg-[#B286FD]/11 px-2">
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/level-one/video-icon.png" alt="" draggable={false} className="h-[33px] w-[33px] object-contain" />
          <span className="text-[14px] leading-[21px] font-medium text-[#B286FD]">Video</span>
        </span>
        <span className="text-[14px] leading-[21px] font-medium text-[#666666] tabular-nums dark:text-white/70">02:45</span>
      </div>

      <div className="mt-2.5 flex w-full shrink-0 flex-col gap-1">
        <h1 className="text-[30px] leading-9 font-semibold text-[#444444] dark:text-white">Introduction to Instructions</h1>
        <p className="text-[16px] leading-6 font-medium text-[#666666] dark:text-white/70">
          Watch this short video to understand instructions with real examples.
        </p>
      </div>
    </LevelOneShell>
  );
}
