"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";
import { GREEN, type Career } from "./careersData";

const EASE = [0.22, 1, 0.36, 1] as const;

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-black/8 bg-white py-2.5 leading-tight">
      <span className="text-sm font-semibold" style={{ color: GREEN }}>
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-[#7B7B80]">{label}</span>
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
  const { Icon } = career;
  const [pickedSkill, setPickedSkill] = useState(career.skills[0]);

  return (
    <main className="h-dvh w-full overflow-hidden bg-white font-[family-name:var(--font-app-poppins)] text-[#444444]">
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col">
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
        {/* Back button 54px from the top, then a 6px gap to the picture. */}
        <div className="px-4 pt-[54px]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border-[1.5px] border-b-[3px] border-[#DFE3E8] bg-white transition-transform active:scale-95"
          >
            <ChevronLeft className="h-[22px] w-[22px] text-[#444444]" strokeWidth={1.65} />
          </button>
        </div>

        <div className="mt-1.5 flex h-[220px] w-full items-center justify-center" style={{ backgroundColor: career.tint }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ color: career.color }}
          >
            <Icon className="h-20 w-20" strokeWidth={2} />
          </motion.div>
        </div>

        <div className="px-4 pb-40 pt-4">
          <motion.h1 {...reveal(0.05)} className="text-[22px] font-semibold leading-tight text-[#2B2B2F]">
            {career.title}
          </motion.h1>

          <motion.div {...reveal(0.1)} className="mt-3 flex gap-2.5">
            <Stat value={`${career.salary}`} label="Salary" />
            <Stat value={`${career.months} mo`} label="Path" />
            <Stat value={String(career.skills.length)} label="Skills" />
          </motion.div>

          <motion.h2 {...reveal(0.15)} className="mt-5 text-sm font-semibold text-[#2B2B2F]">
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
                  className={`h-8 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-300 ${
                    selected
                      ? "border-transparent text-white"
                      : "border-black/8 bg-[#F9F8F6] text-[#444444]"
                  }`}
                  style={selected ? { backgroundColor: GREEN } : undefined}
                >
                  {skill}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-10">
        <div className="pointer-events-auto">
          <Button3D onClick={onStart} className="w-full">
            Start this career
          </Button3D>
        </div>
      </div>
    </div>
    </main>
  );
}
