"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { LevelOneShell, levelOneHref } from "./LevelOneShell";

/**
 * `/module?level=1&step=1` — the opening screen of Module 1: the LEARN chip,
 * "Think like a programmer" and a note about the hidden mystery cards.
 */
export function ModuleIntroScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();

  return (
    <LevelOneShell
      step={1}
      ctaLabel="Let's begin"
      onBack={() => router.push("/level")}
      onContinue={onContinue ?? (() => router.push(levelOneHref(2)))}
    >
      <div className="flex w-full flex-1 flex-col items-center pt-12 text-center">
        <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#2F80ED] bg-[#E5EFFD] py-[5px] pr-3 pl-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F80ED]">
            <BookOpen className="h-[13px] w-[13px] text-white" strokeWidth={2} />
          </span>
          <span className="text-xs leading-4 font-extrabold tracking-[1.2px] text-[#2F80ED] uppercase">
            Learn
          </span>
        </span>

        <p className="mt-4 text-[11px] leading-4 font-bold tracking-[1.2px] text-[#2F80ED] uppercase">
          Module 1 - Lesson 1
        </p>
        <h1 className="mt-2 text-[32px] leading-9 font-extrabold text-[#1F2A44]">
          Think like a
          <br />
          <span className="text-[#00A99D]">programmer</span>
        </h1>

        <div className="my-auto w-full py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/level-one/programmer.png"
            alt="A learner thinking about code beside a laptop"
            draggable={false}
            className="mx-auto h-auto w-[310px] max-w-full select-none"
          />
        </div>

        <p className="mb-4 max-w-[260px] text-sm leading-5 font-medium text-[#444444]">
          12 mystery cards are hidden in this module. Collect them all!
        </p>
      </div>
    </LevelOneShell>
  );
}
