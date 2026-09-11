"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { EventType, Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_INTRO_RIVE_SRC } from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Same artboard every other Robu `.riv` uses (see RobuEyeBlink) — only the
// timeline played on it differs.
const INTRO_ARTBOARD = "Anim Skill";
const INTRO_ANIMATION = "intro";
const INTRO_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuIntroProps {
  className?: string;
  /** Fired once the `intro` timeline finishes playing through (it does not
   * loop, so this fires exactly once). */
  onComplete: () => void;
}

/**
 * Robu's one-time entrance animation (`intro.riv`, the `intro` timeline) —
 * played exactly once, the very first time Robu appears anywhere in the
 * flow, instead of a CSS/framer opacity+scale fade. RobuStage swaps over to
 * the normal, looping `<RobuEyeBlink>` once `onComplete` fires.
 */
export function RobuIntro({ className, onComplete }: RobuIntroProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_INTRO_RIVE_SRC,
    artboard: INTRO_ARTBOARD,
    animations: INTRO_ANIMATION,
    autoplay: true,
    layout: INTRO_LAYOUT,
  });

  useEffect(() => {
    if (!rive) return;

    // A non-looping timeline fires `Stop` on its own once it reaches its
    // last frame — nothing here ever calls stop() itself, so this only ever
    // fires for that natural completion.
    rive.on(EventType.Stop, onComplete);
    return () => rive.off(EventType.Stop, onComplete);
  }, [rive, onComplete]);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
