"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { optionCardClass } from "@/components/onboarding/optionCard";
import { playClickSound } from "@/components/onboarding/clickSound";
import { LevelOneShell } from "./LevelOneShell";

const OPTIONS = [
  { id: "switching-careers", label: "Switching careers into tech", icon: "/images/level-one/switch-careers.png" },
  { id: "first-job", label: "Landing my first job", icon: "/images/level-one/first-job.png" },
] as const;

/** `/level-one/3` — "What teacher is doing?": pick an answer, then Continue. */
export function TeacherQuizScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <LevelOneShell
      step={3}
      ctaDisabled={selectedId === null}
      onContinue={() => router.push("/level-one/4")}
    >
      <h1 className="mt-2 w-full shrink-0 text-center text-[24px] leading-[1.34] font-semibold text-[#2C2C2C] dark:text-white">
        <span className="text-brand-gradient">What</span> teacher is doing?
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/level-one/teacher.png"
        alt=""
        draggable={false}
        className="mt-5 aspect-square w-[346px] max-w-full shrink-0 rounded-[16px] object-cover"
      />

      <div className="mt-8 flex w-full max-w-[331px] shrink-0 flex-col gap-4 px-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              playClickSound();
              setSelectedId(option.id);
            }}
            aria-pressed={option.id === selectedId}
            className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-1.5 text-left ${optionCardClass(option.id === selectedId)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={option.icon} alt="" draggable={false} className="h-9 w-9 shrink-0 object-contain" />
            <span className="text-[16px] font-medium text-[#1A1C22] dark:text-white">{option.label}</span>
          </button>
        ))}
      </div>
    </LevelOneShell>
  );
}
