"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import {
  configureRiveRuntime,
  ROBU_EYEBLINK_RIVE_SRC,
} from "@/lib/rive/runtime";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `robo_new1.riv` — artboard `Anim Skill`. The `robu anim` state machine has no
// inputs, so we drive the timelines directly: the slow `idle2` loop is the
// ambient base (it also keeps Rive's render loop alive), and `ears` is replayed
// on top on a fixed interval.
const ROBU_ARTBOARD = "Anim Skill";
const ROBU_BASE_ANIMATIONS = ["idle2"];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

// Ear-wiggle timeline, played as a one-shot over the base loop every 3 seconds.
const EAR_ANIMATION = "ears";
const EAR_INTERVAL_MS = 3000;

interface RobuEyeBlinkProps {
  /** Sizing / positioning classes for the canvas wrapper. */
  className?: string;
}

/**
 * Robu mascot. The `.riv` is vector-only, so it is cheap to drop onto any
 * screen. Give it a sized wrapper via `className` — the canvas fills it and
 * `Fit.Contain` keeps the whole mascot visible as it scales.
 */
export function RobuEyeBlink({ className }: RobuEyeBlinkProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_EYEBLINK_RIVE_SRC,
    artboard: ROBU_ARTBOARD,
    animations: ROBU_BASE_ANIMATIONS,
    autoplay: true,
    autoBind: true,
    layout: ROBU_LAYOUT,
  });

  // Wiggle the ears every few seconds: replay the `ears` timeline on top of the
  // ambient loop. `stop` before `play` rewinds it so each wiggle starts from
  // frame 0 even if the previous one is still finishing. The base animations
  // keep the render loop running, so the replay stays reliable.
  useEffect(() => {
    if (!rive) return;

    const wiggleEars = () => {
      rive.stop(EAR_ANIMATION);
      rive.play(EAR_ANIMATION);
    };

    const timer = window.setInterval(wiggleEars, EAR_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      rive.stop(EAR_ANIMATION);
    };
  }, [rive]);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
