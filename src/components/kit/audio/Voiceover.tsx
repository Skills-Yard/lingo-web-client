"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { LevelVoiceContext } from "@/components/level-one/LevelVoice";
import { useLevelMuted } from "@/components/level-one/levelMuted";
import { questionSpoken } from "@/components/onboarding/QuestionHeading";
import { isVoiceoverSettled, useVoiceover } from "@/components/onboarding/useVoiceover";

export type VoiceoverProps = {
  /**
   * The clips, played back to back from the moment this mounts: paths under `public/`. A path
   * can end in `#end=<seconds>` to play only the start of a clip, or `#start=<from>,<to>` to play one stretch of it.
   */
  clips?: readonly string[];
  /** Holds the voice until this is true (default: starts at once). */
  start?: boolean;
  /** Cuts the voice off early (an answer was picked). */
  stop?: boolean;
  /** Called once, when the last clip has ended — or could not play, so nothing is left to wait for. */
  onDone?: () => void;
  /** What the voice should talk over: Hex talks while it plays and his bubble types in step with it. */
  children?: ReactNode;
};

/**
 * A screen's voice. It plays the clips and tells everything inside it (`Hex`, `HexGuide`) when
 * it speaks, so Hex talks and his line types in step with the voice. It follows the lesson's sound toggle.
 */
export function Voiceover({ clips, start = true, stop = false, onDone, children }: VoiceoverProps) {
  const [muted] = useLevelMuted();
  const voice = useVoiceover(clips, start, muted, stop);
  const spoken = questionSpoken(voice, !!clips?.length);
  const value = useMemo(
    () => ({ speaking: voice.playing, clip: Math.max(0, voice.clip), spoken, clipProgress: voice.clipProgress, clipCount: clips?.length ?? 0, status: voice.status }),
    [voice.playing, voice.clip, spoken, voice.clipProgress, voice.status, clips?.length],
  );

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  const settled = isVoiceoverSettled(voice.status);
  useEffect(() => {
    if (settled) onDoneRef.current?.();
  }, [settled]);

  return <LevelVoiceContext.Provider value={value}>{children}</LevelVoiceContext.Provider>;
}
