"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Volume2, VolumeX } from "lucide-react";

interface OnboardingHeaderProps {
  onBack: () => void;
  /** Question screens show the step progress + sound toggle (reference
   * screens 8-14); the connector screens before the first question (foxy
   * intro, ready-check, notification permission) show only the back button
   * (reference screens 5-7) — there's nothing to show progress *of* yet. */
  progress?: { step: number; total: number };
  /** Show the sound toggle even without a progress bar (the streak screen). */
  showSound?: boolean;
  muted: boolean;
  onToggleMuted: () => void;
}

export function OnboardingHeader({
  onBack,
  progress,
  showSound = false,
  muted,
  onToggleMuted,
}: OnboardingHeaderProps) {
  return (
    <header className="shrink-0 flex items-center justify-between gap-2.5 px-4 pt-3 pb-2 select-none">
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1A1C22]/80 text-[#1A1C22] hover:bg-black/5 transition-all active:scale-95 cursor-pointer"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {progress && (
        <div className="flex-1 px-2 md:mx-auto md:max-w-xs">
          <p className="mb-1 text-xs font-semibold tabular-nums text-primary">
            {String(progress.step).padStart(2, "0")}/{String(progress.total).padStart(2, "0")}
          </p>
          {/* One continuous track. Each question's header mounts fresh with
              its screen, so the fill starts at the previous question's
              length and grows to this one's. */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: `${((progress.step - 1) / progress.total) * 100}%` }}
              animate={{ width: `${(progress.step / progress.total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </div>
        </div>
      )}

      {progress || showSound ? (
        <button
          type="button"
          onClick={onToggleMuted}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#1A1C22]/70 hover:bg-black/5 transition-all active:scale-95 cursor-pointer"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      ) : (
        // Keeps the back button pinned left (justify-between needs a
        // trailing element) without reserving as much width as the real
        // sound button would.
        <div className="w-10" aria-hidden />
      )}
    </header>
  );
}
