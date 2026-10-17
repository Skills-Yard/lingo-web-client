"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Alignment, Fit, Layout } from "@rive-app/canvas";
import {
  HEX_ARTBOARD,
  HEX_ONBOARDING_TRIGGER,
  HEX_STATE,
  HEX_VIEW_MODEL,
} from "@/lib/rive/runtime";
import { useHexRive } from "@/components/onboarding/robu/useHexRive";

const HEX_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** The `entryStyle` (0-7) Hex enters with; any of them works. */
const ENTRY_STYLE = 7;
/** The panel's Hex enters this long after Check, while the first is still leaving. */
export const PANEL_HEX_DELAY_MS = 450;

/**
 * Hex, played the onboarding way: the `Onboarding` machine, entering with
 * `entryStyle` set and the `enter` trigger fired, and leaving through the
 * `exitRight` trigger when `leaving` turns on.
 */
export function OnboardingHex({ entryKey, leaving = false }: { entryKey: string; leaving?: boolean }) {
  const { RiveComponent, ready, fireNow } = useHexRive(
    HEX_LAYOUT,
    HEX_STATE.onboarding,
    HEX_ARTBOARD,
    HEX_VIEW_MODEL,
    entryKey,
    ENTRY_STYLE,
  );
  useEffect(() => {
    if (ready && leaving) fireNow(HEX_ONBOARDING_TRIGGER.exitRight);
  }, [ready, leaving, fireNow]);
  return <RiveComponent className="h-full w-full" />;
}


const FEEDBACK = {
  correct: {
    title: "Correct, you got it!",
    panel: "bg-[#E3F6F3] dark:bg-[#0F2B28]",
    accent: "text-[#04ACAB]",
    bold: "[&_b]:text-[#04ACAB]",
    badge: "bg-[#04ACAB]",
    Icon: Check,
  },
  wrong: {
    title: "Not quite, try to remember!",
    panel: "bg-[#FDEAEA] dark:bg-[#2E1517]",
    accent: "text-[#E5484D]",
    bold: "[&_b]:text-[#E5484D]",
    badge: "bg-[#E5484D]",
    Icon: X,
  },
} as const;

/**
 * The result sheet: slides up from the bottom behind Continue, with the check
 * (or cross), what the answer is, and Hex entering once the first Hex has left.
 */
export function FeedbackPanel({
  correct,
  hexIn,
  children,
}: {
  correct: boolean;
  hexIn: boolean;
  /** The sentence under the title. */
  children: ReactNode;
}) {
  const look = FEEDBACK[correct ? "correct" : "wrong"];
  const { Icon } = look;
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 240, damping: 30 }}
      className={`absolute inset-x-0 bottom-0 z-0 rounded-t-[28px] px-5 pt-5 pb-[144px] ${look.panel}`}
    >
      <div className="mx-auto flex w-full max-w-[358px] items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white ${look.badge}`}>
              <Icon className="size-4" strokeWidth={3.2} />
            </span>
            <h2 className={`text-[18px] leading-tight font-semibold ${look.accent}`}>{look.title}</h2>
          </div>
          <p className={`mt-2 max-w-[210px] text-[14px] leading-[1.4] font-medium text-[#444444] dark:text-white/80 [&_b]:font-semibold ${look.bold}`}>
            {children}
          </p>
        </div>
        <div aria-hidden className="pointer-events-none -my-1 h-[120px] w-[130px] shrink-0">
          {hexIn && <OnboardingHex entryKey="feedback" />}
        </div>
      </div>
    </motion.div>
  );
}
