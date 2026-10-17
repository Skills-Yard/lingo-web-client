"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import { HEX_STATE } from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";
import { playClickSound } from "@/components/onboarding/clickSound";
import { Confetti } from "./Confetti";
import { LevelOneShell } from "./LevelOneShell";
import { LOOKS, optionState } from "./TeacherFlow";

const CORRECT_ID = "command";

const OPTIONS = [
  { id: "statement", icon: "/images/level-one/statement.png", title: "Statement" },
  { id: "command", icon: "/images/level-one/command.png", title: "Command" },
  { id: "question", icon: "/images/level-one/question.png", title: "Question" },
] as const;

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** Hex resting in his idle loop, between the question and the options. */
function IdleHex() {
  const { RiveComponent } = useHexRive(HEX_LAYOUT, HEX_STATE.idle);
  return <RiveComponent className="h-full w-full" />;
}

/**
 * `/level-one/5` — "What are instructions known as?": a single-answer quiz
 * with Hex between the question and the options. Check locks the answer and
 * marks it right (green) or wrong (red); Continue follows.
 */
export function InstructionQuizScreen({ onContinue }: { onContinue?: () => void }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <LevelOneShell
      step={5}
      ctaDisabled={selectedId === null}
      ctaLabel={checked ? "Continue" : "Check"}
      onBack={() => router.push("/level-one/4")}
      onContinue={() => {
        if (!checked) setChecked(true);
        else (onContinue ?? (() => router.push("/level-one/6")))();
      }}
    >
      <div className="mt-9 flex w-full max-w-[358px] shrink-0 items-center gap-3">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-[#04ACAB]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/level-one/q-badge.png" alt="Question" draggable={false} className="h-[26px] w-[30px] object-contain" />
        </span>
        <h1 className="text-[24px] leading-8 font-semibold text-[#2C2C2C] dark:text-white">
          What are <span className="text-[#00B8A9]">instructions</span> known as?
        </h1>
      </div>

      <div aria-hidden className="pointer-events-none mt-2 h-[150px] w-[180px] shrink-0">
        <IdleHex />
      </div>

      <div className="mt-5 flex w-full max-w-[358px] shrink-0 flex-col gap-[18px]">
        {OPTIONS.map((option) => {
          const state = optionState(option.id, selectedId, checked, CORRECT_ID);
          const look = LOOKS[state];
          return (
            // The khaki bottom edge is the wrapper's 6px border; the card sits
            // flat on top of it and turns green/red with the result.
            <div key={option.id} className={`rounded-sm border-b-[6px] transition-colors ${look.edge}`}>
              <button
                type="button"
                disabled={checked}
                onClick={() => {
                  playClickSound();
                  setSelectedId(option.id);
                }}
                aria-pressed={state === "selected"}
                className={`flex h-[62px] w-full items-center justify-between gap-[15px] rounded-t-lg border px-4 py-2 text-left shadow-[1px_1px_20.9px_-13px_rgba(0,0,0,0.25)] transition-colors ${look.card}`}
              >
                <span className="flex items-center gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={option.icon} alt="" draggable={false} className="h-[46px] w-[46px] shrink-0 object-contain" />
                  <span className="text-[16px] leading-none font-medium text-[#2C2C2C] dark:text-white">
                    {option.title}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full p-1 transition-colors ${look.radio}`}
                >
                  <span className={`h-full w-full rounded-full transition-[scale,background-color] duration-200 ${look.dot}`} />
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <Confetti active={checked && selectedId === CORRECT_ID} />
    </LevelOneShell>
  );
}
