"use client";

import type { CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, ROBU_RIVE_SRC } from "@/lib/rive/runtime";
import { useAmbientLoop, useMoodOverlay, type Mood } from "./RobuEyeBlink";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Same artboard/file every other Robu instance uses (see ROBU_RIVE_SRC) —
// this is a second, independent instance, same pattern as RevealModal's own
// standalone <RobuEyeBlink>, not the single gliding RobuStage mascot.
const ARTBOARD = "Artboard 1";
const BASE_ANIMATIONS = ["idle "];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuReactionProps {
  className?: string;
  style?: CSSProperties;
  /** "happy" for a correct answer, "sad" for an incorrect one — see `useMoodOverlay`. */
  mood: Mood;
}

/**
 * A small standalone Robu, reacting with the artboard's happy/sad eyes+mouth
 * trio (see `useMoodOverlay` — a no-op against `orbi.riv` until it ships a
 * matching trio, so this currently just shows the ambient loop regardless of
 * `mood`) — for a quiz result card's own mascot slot (TeacherQuizScreen /
 * IntroFooter), which previously just bounced a static PNG regardless of
 * whether the answer was right.
 */
export function RobuReaction({ className, style, mood }: RobuReactionProps) {
  const { rive, RiveComponent } = useRive({
    src: ROBU_RIVE_SRC,
    artboard: ARTBOARD,
    animations: BASE_ANIMATIONS,
    autoplay: true,
    layout: LAYOUT,
  });

  useAmbientLoop(rive, BASE_ANIMATIONS);
  useMoodOverlay(rive, mood);

  return (
    <div className={className} style={style}>
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
