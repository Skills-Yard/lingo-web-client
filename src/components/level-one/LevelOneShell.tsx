"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button3D } from "@/components/ui/Button3D";
import { RIVE_BUTTON_H, RIVE_BUTTON_W } from "@/components/ui/RiveButtonFace";
import { HintButton } from "./HintButton";
import type { AnswerResult } from "@/components/ui/RiveProgressBar";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { playClickSound, setClickSoundMuted } from "@/components/onboarding/clickSound";
import { useVoiceover } from "@/components/onboarding/useVoiceover";
import { moduleHref } from "@/lib/routes";
import { LevelVoiceContext } from "./LevelVoice";
import { useLevelMuted } from "./levelMuted";

/** The Figma frame every Level 1 screen is laid out in. */
const FRAME_W = 390;
const FRAME_H = 844;
const MAX_SCALE = 1.5;
/** The header's widest on-screen width (px) — 5xl. */
const HEADER_MAX_W = 1024;

/** Screens in Level 1 (the progress bar's total). */
export const LEVEL_ONE_STEPS = 9;

/** Level 1's `step`th screen (1-based) — `/module?level=1&step=N`. */
export const levelOneHref = (step: number) => moduleHref(1, step);

/** The reward screen between 7 and 8, not one of the numbered screens. */
export const levelOneRewardHref = () => moduleHref(1, "reward");

/** "Lesson complete!", after the last numbered screen. */
export const levelOneCompleteHref = () => moduleHref(1, "complete");

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
  /** A soft blue wash fading down from the top, behind everything. */
  wash?: boolean;
  /** Rendered over everything (popups). */
  overlay?: ReactNode;
  /** Shrinks the whole frame a little further if the content is taller than
   * the screen has room for (other browsers lay text out a few px taller),
   * so the screen never scrolls. */
  fit?: boolean;
  /** Clips played back-to-back once the screen opens; Hex talks meanwhile. */
  voiceover?: readonly string[];
  /** The latest checked answer — plays the progress bar's correct / wrong reaction. */
  answer?: AnswerResult | null;
  /** Shows the hint button left of the main button; `visible` slides it in / out. */
  hint?: { visible: boolean; onUse: () => void };
}

/** The badge count — fixed at 1 for now. */
const HINTS_LEFT = 1;

/** The frame every Level 1 screen shares: header, scrolling body, Continue. */
export function LevelOneShell({ step, onContinue, onBack, ctaDisabled, ctaLabel = "Continue", children, overlay, flush, voiceover, fit, answer, wash, hint }: LevelOneShellProps) {
  const router = useRouter();
  const [muted, toggleMuted] = useLevelMuted();
  useEffect(() => setClickSoundMuted(muted), [muted]);
  const voice = useVoiceover(voiceover, true, muted);
  const levelVoice = useMemo(
    () => ({ speaking: voice.playing, clip: Math.max(0, voice.clip) }),
    [voice.playing, voice.clip],
  );
  const mainRef = useRef<HTMLElement>(null);
  // The screen is laid out as the 390x844 frame and scaled as one piece, so
  // it looks the same (same proportions) on every device. The stage is
  // stretched to fill whatever the frame's shape leaves over.
  const [stage, setStage] = useState<{ scale: number; width: number; height: number } | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  // With `fit`: the stage height (frame px) the content was found to need.
  const needRef = useRef(0);

  // Layout effect: the stage is measured before first paint, so the header
  // (and its bar) is on screen from the very first frame.
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const measure = () => {
      // Installed (full screen) the notch / home bar are padding, not room.
      const rect = main.getBoundingClientRect();
      const inset = getComputedStyle(main);
      const width = rect.width;
      const height = rect.height - parseFloat(inset.paddingTop) - parseFloat(inset.paddingBottom);
      const base = Math.min(width / FRAME_W, height / FRAME_H, MAX_SCALE);
      const scale = fit && needRef.current > FRAME_H ? Math.min(base, height / needRef.current) : base;
      setStage({ scale, width: width / scale, height: height / scale });
    };
    // Content taller than its room: remember how tall the stage must be.
    const check = () => {
      const scroller = scrollerRef.current;
      if (!fit || !scroller) return;
      const over = scroller.scrollHeight - scroller.clientHeight;
      if (over > 1) {
        needRef.current = Math.max(needRef.current, (scroller.parentElement?.parentElement?.getBoundingClientRect().height ?? 0) / (stageScaleRef.current || 1) + over);
        measure();
      }
    };
    measure();
    const observer = new ResizeObserver(() => {
      measure();
      check();
    });
    observer.observe(main);
    if (scrollerRef.current?.firstElementChild) observer.observe(scrollerRef.current.firstElementChild);
    void document.fonts?.ready.then(check);
    const settle = window.setTimeout(check, 400);
    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, [fit]);
  const stageScaleRef = useRef(1);
  stageScaleRef.current = stage?.scale ?? 1;

  return (
    <LevelVoiceContext.Provider value={levelVoice}>
    <main
      ref={mainRef}
      className="onboarding-light relative h-dvh w-full overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] dark:bg-background"
    >
      {/* Pinned to the screen's own top and full width (not the stage's), so it
        reaches the very top edge, behind the status bar too. */}
      {wash && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-full bg-[linear-gradient(180deg,#E3ECFF_0%,rgba(227,236,255,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(47,128,237,0.22)_0%,rgba(47,128,237,0)_100%)]"
          style={{ height: `calc(env(safe-area-inset-top) + ${420 * (stage?.scale ?? 1)}px)` }}
        />
      )}
      <div
        className="absolute left-0 flex origin-top-left flex-col"
        style={{
          top: "env(safe-area-inset-top)",
          width: stage?.width,
          height: stage?.height,
          transform: `scale(${stage?.scale ?? 1})`,
          visibility: stage ? "visible" : "hidden",
          "--stage-scale": stage?.scale ?? 1,
          "--stage-w": `${stage?.width ?? FRAME_W}px`,
          "--stage-h": `${stage?.height ?? FRAME_H}px`,
        } as React.CSSProperties}
      >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {/* The header sits 9px lower than the shared one, putting the page
          count 36px from the top; the negative margin keeps the content
          below exactly where it was. */}
        <div
          className="relative z-10 mx-auto -mb-[9px] w-full pt-[9px]"
          // 5xl on screen, like the onboarding header; the stage is scaled, so divide.
          style={{ maxWidth: HEADER_MAX_W / (stage?.scale ?? 1) }}
        >
          <OnboardingHeader
            onBack={onBack ?? (() => router.back())}
            progress={{ step, total: LEVEL_ONE_STEPS }}
            answer={answer}
            showCount
            muted={muted}
            onToggleMuted={toggleMuted}
          />
        </div>
        {/* The scroller spans the device, so a child can run edge to edge;
          the rest of the content stays in the centred column. */}
        <div ref={scrollerRef} className="scrollbar-none min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {/* Phone width at most: on a desktop the content keeps its proportions
            and sits in the middle instead of stretching across the screen. */}
          <div
            className={`mx-auto flex min-h-full w-full flex-col items-center px-4 ${flush ? "pb-0" : "pb-4"}`}
            style={{ maxWidth: FRAME_W }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Never wider than the 390px frame, so on a desktop the button keeps its
        phone size and sits in the middle instead of stretching across. */}
      <div className="relative z-10 mx-auto w-full shrink-0 px-4 pb-9" style={{ maxWidth: FRAME_W }}>
        {/* Fixed at the full-width button's own ratio, so the row never changes
          height while the hint slides in and the button narrows beside it. */}
        <div className="flex w-full items-center" style={{ aspectRatio: `${RIVE_BUTTON_W} / ${RIVE_BUTTON_H}` }}>
          {hint && (
            <HintButton
              visible={hint.visible}
              count={HINTS_LEFT}
              onPress={() => {
                playClickSound();
                hint.onUse();
              }}
            />
          )}
          <Button3D
            onClick={() => onContinue?.()}
            onPress={playClickSound}
            disabled={ctaDisabled}
            className={`min-w-0 flex-1 ${hint ? "transition-[height] duration-500 ease-out" : ""}`}
            // With the hint showing the button also drops in height (the art
            // scales to fit), so it reads as smaller, not just narrower.
            {...(hint && { style: { aspectRatio: "auto", height: hint.visible ? "74%" : "100%" } })}
          >
            {ctaLabel}
          </Button3D>
        </div>
      </div>

      {overlay}
      </div>
    </main>
    </LevelVoiceContext.Provider>
  );
}
