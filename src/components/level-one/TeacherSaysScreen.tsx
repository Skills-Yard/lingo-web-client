"use client";

import { useRouter } from "next/navigation";
import { LevelOneShell } from "./LevelOneShell";

/** `/level-one/2` — "Let Suppose / Teacher Says": the teacher's instruction. */
export function TeacherSaysScreen() {
  const router = useRouter();

  return (
    <LevelOneShell step={2} onContinue={() => router.push("/level-one/3")}>
      <h1 className="mt-1 flex shrink-0 flex-col items-center text-center">
        <span className="text-brand-gradient text-[20px] leading-[1.34] font-semibold">Let Suppose</span>
        <span className="text-[32px] leading-[1.25] font-bold text-[#2C2C2C] dark:text-white">Teacher Says</span>
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/level-one/teacher.png"
        alt="A teacher saying: Open your notebook"
        draggable={false}
        className="mt-12 aspect-square w-[346px] max-w-full shrink-0 rounded-[16px] object-cover"
      />
    </LevelOneShell>
  );
}
