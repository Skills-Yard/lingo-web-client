"use client";

import { useRouter } from "next/navigation";
import { Maximize, Play, Sparkles } from "lucide-react";
import { playClickSound } from "@/components/onboarding/clickSound";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";
import { SpokenText } from "./SpokenText";
import type { TextSpan } from "@/lib/constants/onboarding";

const HEADING: TextSpan[] = [{ text: "What are " }, { text: "instructions", highlight: true }, { text: "?" }];
/** When What / are / instructions are spoken in screen_6_audio.mpeg, measured from the clip. Its progress runs against the whole 6.41s file, though only the first 2.15s plays. */
const HEADING_TIMING = { clipSeconds: 6.408, times: [[0.49, 0.76], [0.76, 1.12], [1.12, 1.72]], before: 0 } as const;

/** Only "What are instructions?" — the clip carries the next screen's question
 * too, which ends the pause 2.15s in. */
const VIDEO_AUDIO = ["/audios/screen_6_audio.mpeg#end=2.15"];

/**
 * `/module?level=1&step=6` — "What are instructions?": the question, and a
 * short video (thumbnail, player bar) with a note on what it covers.
 */
export function VideoScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();

  return (
    <LevelOneShell
      step={6}
      wash
      voiceover={VIDEO_AUDIO}
      onBack={() => router.push(levelOneHref(5))}
      onContinue={onContinue ?? (() => router.push(levelOneHref(7)))}
    >
      <div className="mt-10 flex w-full shrink-0 flex-col gap-[15px]">
        <h1 className="text-[28px] leading-[134%] font-semibold text-[#444444] dark:text-white">
          <SpokenText spans={HEADING} timing={HEADING_TIMING} />
        </h1>
        <p className="text-[16px] leading-6 font-medium text-[#666666] dark:text-white/70">
          Watch this short video to understand instructions with real examples.
        </p>
      </div>

      <div className="relative mt-[17px] h-[309px] w-[340px] shrink-0">
        <div aria-hidden className="absolute inset-0 bg-[#79DDFF]/24 blur-[75px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/level-one/video-thumbnail-new.png"
          alt="A laptop, a mug and a pen holder on a desk"
          draggable={false}
          className="relative h-full w-full rounded-lg object-cover"
        />
        <button
          type="button"
          aria-label="Play video"
          onClick={playClickSound}
          className="absolute top-[106px] left-1/2 flex h-[69px] w-[69px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[#F0F0FF] bg-white shadow-[1px_1px_13.2px_3px_rgba(0,0,0,0.25)] transition-transform active:scale-95"
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
          <span className="text-[12px] leading-[18px] text-white tabular-nums">02:45</span>
          <Maximize className="h-[17px] w-[17px] shrink-0 text-white" />
        </div>
      </div>

      <div className="mt-5 flex w-full shrink-0 items-center gap-3 rounded-lg bg-[#B286FD]/11 px-2 py-[18px]">
        <Sparkles className="h-[43px] w-[43px] shrink-0 text-[#8E82FF]" strokeWidth={1.5} />
        <span aria-hidden className="h-[55px] w-px shrink-0 bg-[#8E82FF]" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[14px] leading-[21px] font-bold text-[#8859FC]">In this video,</span>
          <p className="text-[14px] leading-[21px] font-medium text-[#666666] dark:text-white/70">
            We will tell that in programming what instructions really known as.
          </p>
        </div>
      </div>
    </LevelOneShell>
  );
}
