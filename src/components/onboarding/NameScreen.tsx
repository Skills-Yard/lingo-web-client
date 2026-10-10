"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DialogueBubble } from "@/components/ui/DialogueBubble";
import { FoxSlot } from "./foxStage";

interface NameScreenProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  /** Enter on the keyboard — moves on when there's a name. */
  onSubmit: () => void;
  className?: string;
}

/** Wait for the screen's crossfade before raising the keyboard. */
const FOCUS_DELAY_MS = 450;

/**
 * "What should I call you?": the question sits in Zox's speech bubble, with
 * the text field as the bubble's second line (a dashed underline, as in the
 * reference), and Zox below it. The field takes focus on arrival so the
 * keyboard opens straight away.
 */
export function NameScreen({ prompt, value, onChange, onSubmit, className }: NameScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`flex min-h-0 flex-col items-center px-6 ${className ?? ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="mt-[6dvh] shrink-0"
      >
        <DialogueBubble
          tail="down"
          className="w-[min(17rem,calc(100vw-3rem))] pb-4 [--bubble-fill:var(--background)]"
          contentClassName="flex flex-col items-center gap-2 px-4 py-3 text-black dark:text-white"
        >
          <label htmlFor="onboarding-name" className="text-center text-[16px] font-medium leading-tight">
            {prompt}
          </label>
          <input
            id="onboarding-name"
            ref={inputRef}
            type="text"
            value={value}
            maxLength={30}
            autoComplete="given-name"
            enterKeyHint="done"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) onSubmit();
            }}
            className="w-full border-0 border-b border-dashed border-primary bg-transparent pb-1 text-center text-[16px] font-medium text-black caret-primary outline-none dark:text-white"
          />
        </DialogueBubble>
      </motion.div>

      <div className="relative min-h-0 w-full flex-1">
        <FoxSlot
          beat="showQuestion"
          beatDue
          className="absolute left-1/2 top-[6dvh] aspect-square -translate-x-1/2"
          style={{ height: "min(15rem, 30dvh)" }}
        />
      </div>
    </div>
  );
}
