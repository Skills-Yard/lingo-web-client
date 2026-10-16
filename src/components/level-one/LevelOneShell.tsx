"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button3D } from "@/components/ui/Button3D";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { playClickSound } from "@/components/onboarding/clickSound";

/** Screens in Level 1 (the progress bar's total). */
export const LEVEL_ONE_STEPS = 7;

interface LevelOneShellProps {
  /** 1-based screen number, shown in the progress bar. */
  step: number;
  onContinue?: () => void;
  /** Defaults to the browser Back. */
  onBack?: () => void;
  /** Greys out Continue until the learner has answered. */
  ctaDisabled?: boolean;
  /** Label of the main button (default "Continue"). */
  ctaLabel?: string;
  /** Content between the header and the Continue button. */
  children: ReactNode;
  /** Rendered over everything (popups). */
  overlay?: ReactNode;
}

/** The frame every Level 1 screen shares: header, scrolling body, Continue. */
export function LevelOneShell({ step, onContinue, onBack, ctaDisabled, ctaLabel = "Continue", children, overlay }: LevelOneShellProps) {
  const router = useRouter();
  const [muted, setMuted] = useState(false);

  return (
    <main className="onboarding-light relative flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <OnboardingHeader
          onBack={onBack ?? (() => router.back())}
          progress={{ step, total: LEVEL_ONE_STEPS }}
          muted={muted}
          onToggleMuted={() => setMuted((m) => !m)}
        />
        <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[390px] shrink-0 px-4 pb-9">
        <Button3D
          onClick={() => onContinue?.()}
          onPress={playClickSound}
          disabled={ctaDisabled}
          className="w-full"
        >
          {ctaLabel}
        </Button3D>
      </div>

      {overlay}
    </main>
  );
}
