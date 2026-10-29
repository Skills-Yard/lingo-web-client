"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MODULE_STEPS } from "@/lib/moduleFlow";
import { missedCount, startReview, useMissedCount } from "@/lib/moduleReview";
import { moduleHref } from "@/lib/routes";
import { OnboardingHex } from "./FeedbackPanel";
import { LevelOneShell } from "./LevelOneShell";

/**
 * `/module?step=review` — after the last screen, when some questions were
 * answered wrong the first time: Hex says they are coming round again, until
 * every one is right. Continue starts the review (see `moduleReview`). The bar
 * is full at the last screen, with the questions to redo added to its total.
 */
export function ReviewIntroScreen() {
  const router = useRouter();
  const count = useMissedCount();

  // Nothing to redo (a reload with the answers gone, or a link): straight to the end.
  // Read in the effect, once the store has been restored from the session.
  useEffect(() => {
    if (missedCount() === 0) router.replace(moduleHref("complete"));
  }, [router]);

  return (
    <LevelOneShell
      step={MODULE_STEPS}
      total={MODULE_STEPS + count}
      ctaLabel="Let’s go"
      onBack={() => router.push("/level")}
      onContinue={() => router.push(moduleHref(startReview() ?? "complete"))}
    >
      <div className="mt-14 flex flex-col items-center text-center">
        <div aria-hidden className="h-[190px] w-[190px] shrink-0">
          <OnboardingHex entryKey="review" />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.3 }}
          className="mt-6 w-[340px] text-[28px] leading-[134%] font-semibold text-[#2C2C2C]"
        >
          Let’s fix the ones you <span className="text-level-gradient">missed</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-3 w-[320px] text-[16px] leading-6 font-medium text-[#444444]"
        >
          {count === 1 ? "1 question" : `${count} questions`} to go again. Keep going until you get every one right.
        </motion.p>
      </div>
    </LevelOneShell>
  );
}
