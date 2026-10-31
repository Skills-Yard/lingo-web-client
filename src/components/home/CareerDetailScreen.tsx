"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { BUTTON } from "@/lib/rive/runtime";
import type { Career } from "./careersData";

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white py-3 shadow-[0_1px_8px_rgba(0,0,0,0.1)] dark:bg-[#1A1C22]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" draggable={false} className="h-[34px] w-[34px] select-none object-contain" />
      <span className="mt-0.5 text-sm font-semibold leading-tight text-[#2B2B2F] dark:text-white">{value}</span>
      <span className="text-[11px] leading-tight text-[#818185] dark:text-[#9FA19F]">{label}</span>
    </div>
  );
}

/**
 * One career: its picture, the pay / length / skill count, the skills it
 * teaches, and "Start this career", which sets off down the learner's path.
 */
export function CareerDetailScreen({
  career,
  onBack,
  onStart,
}: {
  career: Career;
  onBack: () => void;
  onStart: () => void;
}) {
  const [pickedSkill, setPickedSkill] = useState(career.skills[0]);

  return (
    <main className="h-dvh w-full overflow-hidden bg-white font-[family-name:var(--font-app-poppins)] text-[#444444] dark:bg-[#0F1F26] dark:text-white">
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col">
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        {/* The picture, with the back arrow over it. */}
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/career-details-header.png"
            alt=""
            draggable={false}
            className="block aspect-[3/2] w-full select-none object-cover dark:brightness-90"
          />
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute left-4 top-[54px] flex h-10 w-10 items-center justify-center transition-transform active:scale-95"
          >
            <ArrowLeft className="h-6 w-6 text-[#444444]" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-4 pb-40 pt-4">
          <motion.h1 {...reveal(0.05)} className="text-2xl font-bold leading-tight text-[#2B2B2F] dark:text-white">
            {career.title}
          </motion.h1>

          <motion.div {...reveal(0.1)} className="mt-4 flex gap-3">
            <Stat icon="/images/salary.png" value={career.salary} label="Salary" />
            <Stat icon="/images/path.png" value={`${career.months} mo`} label="Path" />
            <Stat icon="/images/skills.png" value={String(career.skills.length)} label="Skills" />
          </motion.div>

          <motion.h2 {...reveal(0.15)} className="mt-6 text-base font-semibold text-[#2B2B2F] dark:text-white">
            Skills you&apos;ll learn
          </motion.h2>
          <motion.div {...reveal(0.2)} className="mt-2.5 flex flex-wrap gap-2">
            {career.skills.map((skill) => {
              const selected = skill === pickedSkill;
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setPickedSkill(skill)}
                  aria-pressed={selected}
                  className={`h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-300 ${
                    selected
                      ? "bg-[#5D4CFE] text-white"
                      : "bg-[#F4F4F5] text-[#444444] dark:bg-[#16262D] dark:text-[#C8C7C5]"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0F1F26] dark:via-[#0F1F26]/90 px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-10">
        {/* The padding is laid out around the room the old button artboard left
          around the button (see `BUTTON.room`). */}
        <div className="pointer-events-auto" style={{ paddingTop: BUTTON.room.module.top, paddingBottom: BUTTON.room.module.bottom }}>
          <Button3D riveVariant="module" onClick={onStart} className="w-full">
            Start this career
          </Button3D>
        </div>
      </div>
    </div>
    </main>
  );
}
