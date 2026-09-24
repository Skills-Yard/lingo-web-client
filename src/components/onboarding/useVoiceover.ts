"use client";

import { useEffect, useRef, useState } from "react";

export type VoiceoverStatus = "idle" | "playing" | "done" | "failed";

export interface Voiceover {
  status: VoiceoverStatus;
  /** True only while a clip is audibly advancing — drives the fox's mouth. */
  playing: boolean;
  /** 0..1 through the whole sequence (each clip weighted equally), updated
   * every frame while playing — drives voice-synced typing. */
  progress: number;
  /** Which clip of the sequence is current (0-based), and 0..1 through it —
   * e.g. a question screen's question clip vs. its options clip. */
  clip: number;
  clipProgress: number;
}

/**
 * Plays a screen's voiceover clips back-to-back, once, from the moment
 * `start` turns true — e.g. a question clip followed by its options clip —
 * and reports how far through it is, so text and the fox's mouth can follow
 * the voice exactly (see FoxMessageScreen).
 *
 * `muted` is applied live to the playing element rather than stopping it, so
 * toggling the header's sound button mid-line mutes/unmutes without losing
 * the place in the sequence — and synced typing keeps going either way.
 * Leaving the screen (unmount) stops playback.
 *
 * Autoplay is fine here without extra handling: every screen with a voice is
 * reached by a tap (Get Started / Continue), which gives the page the user
 * activation browsers require. If a browser still refuses, status becomes
 * "failed" and callers fall back to their unsynced behaviour.
 */
export function useVoiceover(
  srcs: readonly string[] | undefined,
  start: boolean,
  muted: boolean,
): Voiceover {
  const [status, setStatus] = useState<VoiceoverStatus>("idle");
  // Current clip and how far through it, updated every frame while playing.
  const [position, setPosition] = useState({ clip: 0, t: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);
  const key = srcs?.join("|") ?? "";

  useEffect(() => {
    mutedRef.current = muted;
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!start || !key) return;
    const queue = key.split("|");
    const audio = new Audio();
    audio.muted = mutedRef.current;
    audioRef.current = audio;
    let cancelled = false;
    let index = 0;
    let frame = 0;

    const tick = () => {
      if (cancelled) return;
      const t = audio.duration > 0 ? Math.min(1, audio.currentTime / audio.duration) : 0;
      setPosition({ clip: index - 1, t });
      frame = window.requestAnimationFrame(tick);
    };

    const playNext = () => {
      if (cancelled) return;
      if (index >= queue.length) {
        window.cancelAnimationFrame(frame);
        setPosition({ clip: queue.length - 1, t: 1 });
        setStatus("done");
        return;
      }
      audio.src = queue[index++];
      audio
        .play()
        .then(() => {
          if (cancelled) return;
          setStatus("playing");
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(tick);
        })
        .catch(() => {
          if (!cancelled) setStatus("failed");
        });
    };

    audio.addEventListener("ended", playNext);
    playNext();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      audio.removeEventListener("ended", playNext);
      audio.pause();
      audioRef.current = null;
    };
  }, [start, key]);

  const count = key ? key.split("|").length : 1;
  return {
    status,
    playing: status === "playing",
    progress: status === "done" ? 1 : (position.clip + position.t) / count,
    clip: position.clip,
    clipProgress: position.t,
  };
}
