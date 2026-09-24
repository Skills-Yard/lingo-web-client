"use client";

import { OnboardingFox } from "./robu/OnboardingFox";
import { Button3D } from "@/components/ui/Button3D";
import { playClickSound } from "./clickSound";

interface NotificationPermissionScreenProps {
  heading: string;
  cta: string;
  onContinue: () => void;
  className?: string;
}

/**
 * The reference design's notification-priming screen — the "Notification"
 * card here is a plain illustration (real system permission prompts render
 * with whatever chrome the OS/browser gives them, never this exact card, so
 * it can't be reproduced pixel-for-pixel as real UI). Pressing "Continue"
 * fires the actual `Notification.requestPermission()` prompt when the
 * browser supports it, then advances regardless of the learner's choice —
 * same "priming screen first, real permission prompt second" pattern most
 * apps use, so this illustration only ever sets expectations rather than
 * standing in for the real dialog.
 */
export function NotificationPermissionScreen({
  heading,
  cta,
  onContinue,
  className,
}: NotificationPermissionScreenProps) {
  const handleContinue = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().catch(() => {});
    }
    onContinue();
  };

  return (
    <div
      className={`flex flex-col items-center bg-[#EDEDED] px-6 ${className ?? ""}`}
    >
      <h1 className="mt-[3dvh] max-w-xs shrink-0 text-center text-xl font-semibold leading-snug text-[#1A1C22] sm:text-2xl">
        {heading}
      </h1>

      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center">
        <OnboardingFox className="aspect-square h-[min(9rem,22dvh)]" />

        {/* Illustration only — see doc comment above. */}
        <div
          aria-hidden
          className="-mt-6 w-full max-w-72 rounded-xl border border-black/10 bg-white p-4 text-center shadow-xl sm:w-80"
        >
          <p className="text-sm font-semibold text-[#1A1C22]">Notification</p>
          <p className="mt-1 text-xs text-[#666666]">
            &ldquo;Lingo&rdquo; would like to send you notifications
          </p>
          <div className="mt-3 grid grid-cols-2 divide-x divide-black/10 border-t border-black/10 text-sm">
            <span className="py-2.5 text-[#666666]">Don&apos;t Allow</span>
            <span className="py-2.5 font-medium text-primary">Allow</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs shrink-0 pb-4 sm:max-w-sm sm:pb-6">
        <Button3D onClick={handleContinue} onPress={playClickSound} className="w-full">
          {cta}
        </Button3D>
      </div>
    </div>
  );
}
