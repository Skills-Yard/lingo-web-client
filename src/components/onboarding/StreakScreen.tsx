"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { TextSpan } from "@/lib/constants/onboarding";
import { QuestionHeading } from "./QuestionHeading";

const CARD_DELAY_S = 0.3;
const CARD_IN = { type: "spring", stiffness: 260, damping: 26 } as const;

interface StreakScreenProps {
  heading: TextSpan[];
  /** The home-screen mockup with the streak widget (public/images/codingStreak). */
  image: string;
  className?: string;
}

/**
 * "Keep your coding streak going": the same fox + text row the question
 * screens use, over a phone-home-screen mockup showing Lingo's streak
 * widget. The mockup rises in once the screen has faded in; if it's taller
 * than the space left above the CTA, its (empty) bottom is cropped behind a
 * soft fade instead of shrinking the widget.
 */
export function StreakScreen({ heading, image, className }: StreakScreenProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex min-h-0 flex-col px-4 ${className ?? ""}`}>
      <QuestionHeading heading={heading} spoken={1} talking={false} />

      <div className="relative mt-5 min-h-0 flex-1 overflow-hidden">
        <motion.img
          src={image}
          alt="Lingo's streak widget on your home screen"
          draggable={false}
          className="absolute top-0 left-1/2 h-auto w-[min(100%,21rem)] -translate-x-1/2 select-none"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...CARD_IN, delay: CARD_DELAY_S }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-background"
        />
      </div>
    </div>
  );
}
