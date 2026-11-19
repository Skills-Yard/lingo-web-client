"use client";

import { Confetti } from "@/components/level-one/components/Confetti";
import { XpBurst } from "@/components/level-one/components/FeedbackPanel";

/** The right-answer cheer: confetti shot up from the bottom and a big "+10 XP". Plays each time `active` turns on. */
export function Celebration({ active }: { active: boolean }) {
  return (
    <>
      <Confetti active={active} />
      <XpBurst show={active} />
    </>
  );
}
