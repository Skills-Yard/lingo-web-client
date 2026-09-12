"use client";

import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_INTRO_RIVE_SRC } from "@/lib/rive/runtime";
import { useAmbientLoop, usePeriodicOverlay } from "@/lib/rive/useRobuAmbientLoop";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// `robu-intro.riv` — same `Anim Skill` artboard/rig as `robu_update_day2.riv`
// (RobuEyeBlink), so it's driven the same way: `idle2` is the ambient base,
// `ears` / `eyeblink2` replay on top on their own interval. This file also
// carries a dedicated `hii` greeting clip and an `Intro state machine`,
// authored for this screen, that aren't wired up yet.
const ROBU_ARTBOARD = "Anim Skill";
const ROBU_BASE_ANIMATIONS = ["idle2"];
const ROBU_LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

const EAR_ANIMATION = "ears";
const EAR_INTERVAL_MS = 3000;

const EYEBLINK_ANIMATION = "eyeblink2";
const EYEBLINK_INTERVAL_MS = 5000;

interface RobuIntroMascotProps {
  /** Sizing / positioning classes for the canvas wrapper. */
  className?: string;
}

/**
 * Robu mascot for the opening "Hi, I'm Robu!" greeting screen. Give it a
 * sized wrapper via `className` — the canvas fills it and `Fit.Contain`
 * keeps the whole mascot visible as it scales.
 */
export function RobuIntroMascot({ className }: RobuIntroMascotProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_INTRO_RIVE_SRC,
    artboard: ROBU_ARTBOARD,
    animations: ROBU_BASE_ANIMATIONS,
    autoplay: true,
    autoBind: true,
    layout: ROBU_LAYOUT,
  });

  useAmbientLoop(rive, ROBU_BASE_ANIMATIONS);
  usePeriodicOverlay(rive, EAR_ANIMATION, EAR_INTERVAL_MS);
  usePeriodicOverlay(rive, EYEBLINK_ANIMATION, EYEBLINK_INTERVAL_MS);

  return (
    <div className={className}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
