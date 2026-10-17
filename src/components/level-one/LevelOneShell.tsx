"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button3D } from "@/components/ui/Button3D";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { playClickSound } from "@/components/onboarding/clickSound";

/** The Figma frame every Level 1 screen is laid out in. */
const FRAME_W = 390;
const FRAME_H = 844;
const MAX_SCALE = 1.5;

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
  /** Drops the padding under the content, so it runs right down to Continue. */
  flush?: boolean;
  /** Rendered over everything (popups). */
  overlay?: ReactNode;
}

/** The frame every Level 1 screen shares: header, scrolling body, Continue. */
export function LevelOneShell({ step, onContinue, onBack, ctaDisabled, ctaLabel = "Continue", children, overlay, flush }: LevelOneShellProps) {
  const router = useRouter();
  const [muted, setMuted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  // The screen is laid out as the 390x844 frame and scaled as one piece, so
  // it looks the same (same proportions) on every device. The stage is
  // stretched to fill whatever the frame's shape leaves over.
  const [stage, setStage] = useState<{ scale: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      const { width, height } = main.getBoundingClientRect();
      const scale = Math.min(width / FRAME_W, height / FRAME_H, MAX_SCALE);
      setStage({ scale, width: width / scale, height: height / scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={mainRef}
      className="onboarding-light relative h-dvh w-full overflow-hidden bg-white dark:bg-background"
    >
      <div
        className="absolute top-0 left-0 flex origin-top-left flex-col"
        style={{
          width: stage?.width,
          height: stage?.height,
          transform: `scale(${stage?.scale ?? 1})`,
          visibility: stage ? "visible" : "hidden",
          "--stage-w": `${stage?.width ?? FRAME_W}px`,
        } as React.CSSProperties}
      >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {/* The header sits 24px lower than the shared one, putting the page
          count 51px from the top; the negative margin keeps the content
          below exactly where it was. */}
        <div className="relative z-10 mx-auto -mb-6 w-full max-w-[390px] pt-6">
          <OnboardingHeader
            onBack={onBack ?? (() => router.back())}
            progress={{ step, total: LEVEL_ONE_STEPS }}
            muted={muted}
            onToggleMuted={() => setMuted((m) => !m)}
          />
        </div>
        {/* The scroller spans the device, so a child can run edge to edge;
          the rest of the content stays in the centred column. */}
        <div className="scrollbar-none min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className={`mx-auto flex min-h-full w-full max-w-[390px] flex-col items-center px-4 ${flush ? "pb-0" : "pb-4"}`}>
            {children}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[390px] shrink-0 px-4 pb-9">
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
      </div>
    </main>
  );
}
