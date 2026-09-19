"use client";

import type { CSSProperties } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment } from "@rive-app/canvas";
import { configureRiveRuntime, getRobuRiveSrc } from "@/lib/rive/runtime";
import { useTheme } from "@/context/ThemeContext";
import { useAmbientLoop, useMoodOverlay, type Mood } from "./RobuEyeBlink";

// Register the same-origin WASM URLs before the first canvas mounts.
configureRiveRuntime();

// Same artboard/file every other Robu instance uses (see getRobuRiveSrc) —
// this is a second, independent instance, same pattern as RevealModal's own
// standalone <RobuEyeBlink>, not the single gliding RobuStage mascot.
const ARTBOARD = "Anim Skill";
const BASE_ANIMATIONS = ["idle2"];
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

interface RobuReactionProps {
  className?: string;
  style?: CSSProperties;
  /** "happy" for a correct answer, "sad" for an incorrect one — see `useMoodOverlay`. */
  mood: Mood;
}

/**
 * A small standalone Robu, reacting with the artboard's happy/sad eyes+mouth
 * trio — for a quiz result card's own mascot slot (TeacherQuizScreen /
 * IntroFooter), which previously just bounced a static PNG regardless of
 * whether the answer was right.
 */
export function RobuReaction({ className, style, mood }: RobuReactionProps) {
  const { theme } = useTheme();
  return (
    <RobuReactionCanvas
      key={theme}
      className={className}
      style={style}
      mood={mood}
      src={getRobuRiveSrc(theme)}
    />
  );
}

function RobuReactionCanvas({ className, style, mood, src }: RobuReactionProps & { src: string }) {
  const { rive, RiveComponent } = useRive({
    src,
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
