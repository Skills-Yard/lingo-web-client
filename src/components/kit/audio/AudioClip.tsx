"use client";

import { AudioPlayer as VoiceClipPill } from "@/components/level-two/AudioPlayer";

export type AudioClipProps = {
  /** The clip: a path under `public/` (`/audios/...`). */
  src: string;
  /**
   * For a clip that is not recorded yet: when the file cannot be played, Play still runs for
   * this many seconds, so what follows the clip can be seen working.
   */
  standInSeconds?: number;
  /** Told how far (0-1) the clip has played, as it plays, and 1 when it has ended. */
  onProgress?: (fraction: number) => void;
};

/**
 * The voice-clip pill: a teal play button, a waveform that fills as the clip plays, and its
 * length counting down. Tapping plays and pauses it. It follows the lesson's sound toggle.
 */
export function AudioClip(props: AudioClipProps) {
  return <VoiceClipPill {...props} />;
}
